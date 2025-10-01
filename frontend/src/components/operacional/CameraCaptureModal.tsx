import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw } from 'lucide-react';

interface CameraCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  open,
  onOpenChange,
  onCapture
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste dispositivo');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira no mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para blob e criar arquivo
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        onOpenChange(false);
      }
    }, 'image/jpeg', 0.8);
  };

  const switchCamera = async () => {
    stopCamera();
    await startCamera();
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[95vw] p-0 bg-black">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg">Capturar Foto</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Iniciando câmera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="text-white text-center p-4">
                <p className="mb-4">{error}</p>
                <Button onClick={startCamera} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-64 sm:h-80 object-cover"
            playsInline
            muted
          />

          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>

        <div className="p-4 bg-gray-900">
          <div className="flex gap-3">
            <Button
              onClick={switchCamera}
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Trocar Câmera
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={isLoading || !!error}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capturar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCaptureModal;
