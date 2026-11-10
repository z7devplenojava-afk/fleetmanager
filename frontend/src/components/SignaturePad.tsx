import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Check, Eraser, PenLine } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  onClear?: () => void;
  signerName?: string;
  compact?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClear,
  signerName,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const setupCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    if (canvas.width === targetW && canvas.height === targetH) return;

    // Preserva desenho existente ao redimensionar
    let prevDataUrl: string | null = null;
    if (!isEmpty && canvas.width > 0 && canvas.height > 0) {
      prevDataUrl = canvas.toDataURL('image/png');
    }

    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = compact ? 2.2 : 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (prevDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = prevDataUrl;
    }
  }, [compact, isEmpty]);

  useEffect(() => {
    setupCanvasSize();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setupCanvasSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [setupCanvasSize]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setupCanvasSize();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar se não suportado
    }
    setIsDrawing(true);
    setIsEmpty(false);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      // Desenha ponto inicial caso seja um toque rápido
      ctx.lineTo(x + 0.01, y + 0.01);
      ctx.stroke();
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const endDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      setIsEmpty(true);
    }
    if (onClear) onClear();
  };

  const save = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center w-full ${compact ? 'space-y-2.5' : 'space-y-3 max-w-lg mx-auto'}`}
    >
      <div
        className={`relative w-full ${
          compact ? 'h-32 sm:h-36' : 'aspect-[2/1]'
        } bg-white rounded-lg shadow-inner overflow-hidden border-2 border-dashed border-gray-300`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none select-none block"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerCancel={endDrawing}
        />
        {/* Linha guia de assinatura */}
        <div className="pointer-events-none absolute left-5 right-5 bottom-5 border-b border-gray-300/80" />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400 select-none px-3 text-center">
            <PenLine className="h-4 w-4 mb-1 text-gray-400/80" />
            <span className="text-xs font-medium">
              {signerName ? `Assine com o dedo ou mouse (${signerName})` : 'Assine aqui com o dedo ou mouse'}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 w-full">
        <Button
          type="button"
          variant="outline"
          size={compact ? 'sm' : 'default'}
          className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 text-xs"
          onClick={clear}
        >
          <Eraser className="h-3.5 w-3.5 mr-1.5" />
          Limpar
        </Button>
        <Button
          type="button"
          size={compact ? 'sm' : 'default'}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
          onClick={save}
          disabled={isEmpty}
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
