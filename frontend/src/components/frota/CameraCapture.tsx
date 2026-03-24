'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';

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
      setError(msg.includes('Permission') ? 'Permissão de câmera negada.' : 'Não foi possível acessar a câmera.');
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {label}
        </span>
        {isStreaming ? (
          <Button type="button" variant="outline" size="sm" onClick={stopStream} className="border-gray-600">
            Desligar câmera
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startCamera}
            disabled={disabled}
            className="border-gray-600"
          >
            <Camera className="h-4 w-4 mr-2" />
            Ativar câmera
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-amber-500">{error}</p>
      )}

      {isStreaming && (
        <div className="relative rounded-lg overflow-hidden bg-black border border-gray-700">
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
              className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
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

      {capturedPhotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {capturedPhotos.map((file, idx) => (
            <div key={`${file.name}-${file.size}-${file.lastModified}-${idx}`} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Foto ${idx + 1}`}
                className="w-16 h-16 object-cover rounded border border-gray-600"
              />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover foto"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
