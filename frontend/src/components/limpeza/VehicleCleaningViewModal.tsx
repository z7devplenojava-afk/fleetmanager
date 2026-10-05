import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download, Printer, X, ZoomIn, ZoomOut, RotateCw, FileText,
  ExternalLink, Loader2, RefreshCw
} from 'lucide-react';
import {
  VehicleCleaningOrder,
  CleaningSupplyItem,
  PHASE_LABELS,
} from '@/services/vehicleCleaningService';
import {
  generateCleaningDocumentHTMLBlob,
  generateCleaningDocumentHTML,
  downloadCleaningReleasePDF,
  openCleaningReleasePDFPreview,
} from '@/utils/vehicleCleaningPdfGenerator';
import { useToast } from '@/hooks/use-toast';

export interface VehicleCleaningViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: VehicleCleaningOrder | null;
  supplies?: CleaningSupplyItem[];
}

export const VehicleCleaningViewModal: React.FC<VehicleCleaningViewModalProps> = ({
  isOpen,
  onClose,
  order,
  supplies,
}) => {
  const { toast } = useToast();
  const [docBlob, setDocBlob] = useState<Blob | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const osNumber = order?.id
    ? `OS-HIG-${order.id.substring(0, 8).toUpperCase()}`
    : 'OS-HIG';
  const fileName = `ordem-higienizacao-${(order?.vehiclePlate || 'veiculo').replace(/[^a-zA-Z0-9-_]/g, '')}-${osNumber}.pdf`;

  // Gera o documento formatado
  useEffect(() => {
    let isMounted = true;

    if (isOpen && order) {
      setIsLoading(true);
      try {
        const blob = generateCleaningDocumentHTMLBlob(order, supplies);
        if (isMounted) setDocBlob(blob);
      } catch (err) {
        console.error('Falha ao gerar documento da OS de Higienização:', err);
        if (isMounted) {
          toast({
            title: 'Erro ao gerar documento',
            description: 'Não foi possível carregar a visualização da OS.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
      setZoom(1);
      setRotation(0);
    } else {
      setDocBlob(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, order, supplies, toast]);

  // Cria e gerencia a URL do Blob
  useEffect(() => {
    if (docBlob && isOpen) {
      const url = URL.createObjectURL(docBlob);
      setDocUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setDocUrl(null);
      };
    } else {
      if (docUrl) {
        URL.revokeObjectURL(docUrl);
        setDocUrl(null);
      }
    }
  }, [docBlob, isOpen]);

  const handleDownload = () => {
    if (order) {
      try {
        downloadCleaningReleasePDF(order, supplies);
        toast({ title: 'Download iniciado', description: fileName });
      } catch {
        toast({ title: 'Erro', description: 'Falha ao baixar o PDF.', variant: 'destructive' });
      }
    }
  };

  const handlePrint = () => {
    if (order) {
      openCleaningReleasePDFPreview(order, supplies);
    }
  };

  const handleOpenInNewTab = () => {
    if (order) {
      const html = generateCleaningDocumentHTML(order, supplies);
      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      }
    }
  };

  const handleReload = () => {
    if (order) {
      setIsLoading(true);
      try {
        const blob = generateCleaningDocumentHTMLBlob(order, supplies);
        setDocBlob(blob);
        toast({ title: 'OS Atualizada', description: 'O documento foi regenerado com sucesso.' });
      } catch {
        toast({ title: 'Erro', description: 'Falha ao recarregar documento.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const phaseLabel = order ? (PHASE_LABELS[order.phase || 'AGUARDANDO'] || order.phase || order.status) : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[92vh] max-h-[95vh] overflow-hidden bg-seguranca-graphite border-gray-700 p-0 flex flex-col z-[10100]">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-seguranca-black via-gray-900 to-seguranca-black border-b border-gray-800 p-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-white text-base sm:text-lg font-bold flex items-center gap-2">
                  <span>Ordem de Serviço</span>
                  <Badge className="bg-red-600 text-white font-mono text-xs px-2 py-0.5">
                    #{osNumber}
                  </Badge>
                  {phaseLabel && (
                    <Badge variant="outline" className="text-xs text-gray-300 border-gray-600 hidden sm:inline-flex">
                      {phaseLabel}
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {order?.vehiclePlate ? `Veículo: ${order.vehiclePlate} ${order.vehicleModel ? `(${order.vehicleModel})` : ''}` : 'Documento Oficial de Higienização e Lavajato'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReload}
                disabled={isLoading}
                title="Recarregar OS"
                className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 bg-seguranca-black border-b border-gray-800 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6 || !docUrl}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2"
              title="Reduzir zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-gray-400 font-mono text-xs min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5 || !docUrl}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              disabled={!docUrl}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 px-2 ml-1"
              title="Girar 90°"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              disabled={!order}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 text-xs"
              title="Abrir em uma aba do navegador"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Nova Aba
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!order}
              className="border-gray-700 text-gray-200 hover:bg-gray-800 h-7 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Baixar
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={!order}
              className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="flex-1 bg-[#1e1e24] overflow-auto flex items-center justify-center p-2 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-400 p-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <p className="text-sm font-medium">Gerando documento da Ordem de Serviço...</p>
              <p className="text-xs text-gray-500">Compilando itens de checklist, insumos e identificação</p>
            </div>
          ) : docUrl ? (
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'top center',
              }}
            >
              <iframe
                src={docUrl}
                className="w-full h-full min-h-[600px] border-0 rounded bg-white shadow-2xl max-w-4xl"
                title={`OS-${osNumber}`}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-gray-400 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-600 mb-1" />
              <p className="text-sm font-semibold text-gray-300">Nenhum documento disponível para visualização</p>
              <p className="text-xs text-gray-500 max-w-sm">
                Selecione uma solicitação para visualizar e imprimir a Ordem de Serviço padronizada.
              </p>
              {order?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReload}
                  className="border-red-500/50 text-red-400 mt-2"
                >
                  Tentar Novamente
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleCleaningViewModal;
