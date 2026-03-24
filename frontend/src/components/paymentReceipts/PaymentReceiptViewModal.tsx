import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, User, Calendar, FileText, DollarSign, AlertCircle, Loader2, ZoomIn, ZoomOut, RotateCw, Undo2, Redo2, Printer, MoreHorizontal, Receipt } from 'lucide-react';
import type { PaymentReceipt } from '@/services/paymentReceiptService';
import paymentReceiptService from '@/services/paymentReceiptService';
import { toast } from 'sonner';

interface PaymentReceiptViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: PaymentReceipt | null;
  onDownload: (receiptId: string, fileName: string) => void;
}

export function PaymentReceiptViewModal({
  open,
  onOpenChange,
  receipt,
  onDownload,
}: PaymentReceiptViewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detecta se está em dispositivo móvel
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (open && receipt) {
      loadPdf();
      // Reset zoom and rotation when opening new receipt
      setZoom(1);
      setRotation(0);
    } else {
      setPdfUrl(null);
      setError(null);
    }
  }, [open, receipt]);

  const loadPdf = async () => {
    if (!receipt) return;

    setLoading(true);
    setError(null);

    try {
      const pdfBlob = await paymentReceiptService.getPaymentReceiptPdf(receipt.id);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Erro ao carregar PDF:', err);
      setError('Erro ao carregar o PDF do comprovante');
      toast.error('Erro ao carregar o PDF do comprovante');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (receipt) {
      onDownload(receipt.id, receipt.fileName);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePrint = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      toast.success('PDF aberto em nova aba');
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'ERROR':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'Processado';
      case 'PENDING':
        return 'Pendente';
      case 'ERROR':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] sm:w-[90vw] sm:h-[90vh] lg:max-w-6xl lg:max-h-[90vh] bg-gradient-to-br from-seguranca-graphite via-seguranca-black to-seguranca-graphite border border-gray-600/50 rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Receipt size={20} className="sm:hidden text-white" />
                <Receipt size={24} className="hidden sm:block text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-bold text-white leading-tight flex items-center gap-2">
                  <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                  <span>Visualização do Comprovante</span>
                </DialogTitle>
                <p className="text-blue-300/90 text-xs sm:text-sm font-medium mt-1 truncate max-w-[200px] sm:max-w-none">
                  {receipt.employeeName}
                </p>
              </div>
            </div>
            <Badge className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl border ${getStatusColor(receipt.status)}`}>
              {getStatusText(receipt.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Informações do Comprovante */}
          <div className="w-full lg:w-1/3 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-gray-600/30 bg-seguranca-black/30 max-h-[40vh] lg:max-h-none overflow-y-auto">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Informações do Comprovante</h3>
              
              {/* Nome do Funcionário */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User size={16} className="sm:hidden text-white" />
                    <User size={18} className="hidden sm:block text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-300/80 text-xs sm:text-sm font-medium">Funcionário</p>
                    <p className="text-white font-semibold text-sm sm:text-base truncate">{receipt.employeeName}</p>
                  </div>
                </div>
              </div>

              {/* Valor */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign size={16} className="sm:hidden text-white" />
                    <DollarSign size={18} className="hidden sm:block text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-green-300/80 text-xs sm:text-sm font-medium">Valor</p>
                    <p className="text-white font-semibold text-base sm:text-lg">{formatCurrency(receipt.netSalary || receipt.grossSalary)}</p>
                  </div>
                </div>
              </div>

              {/* Data de Processamento */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="sm:hidden text-white" />
                    <Calendar size={18} className="hidden sm:block text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-yellow-300/80 text-xs sm:text-sm font-medium">Processado em</p>
                    <p className="text-white font-semibold text-sm sm:text-base">{receipt.processedAt ? formatDate(receipt.processedAt) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Arquivo */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="sm:hidden text-white" />
                    <FileText size={18} className="hidden sm:block text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-purple-300/80 text-xs sm:text-sm font-medium">Arquivo</p>
                    <p className="text-white font-semibold text-sm sm:text-base truncate" title={receipt.fileName}>{receipt.fileName}</p>
                  </div>
                </div>
              </div>

              {/* Nome da Conta Creditada */}
              {receipt.creditedName && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User size={16} className="sm:hidden text-white" />
                      <User size={18} className="hidden sm:block text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-indigo-300/80 text-xs sm:text-sm font-medium">Nome da Conta Creditada</p>
                      <p className="text-white font-semibold text-sm sm:text-base truncate">{receipt.creditedName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conta Corrente Creditada */}
              {receipt.creditedAccount && (
                <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="sm:hidden text-white" />
                      <FileText size={18} className="hidden sm:block text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-cyan-300/80 text-xs sm:text-sm font-medium">Conta Corrente Creditada</p>
                      <p className="text-white font-semibold text-sm sm:text-base truncate">{receipt.creditedAccount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-4">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 text-sm sm:text-base"
                >
                  <Download size={16} className="sm:hidden mr-1.5" />
                  <Download size={18} className="hidden sm:block mr-2" />
                  <span className="hidden sm:inline">Baixar Comprovante</span>
                  <span className="sm:hidden">Baixar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Área do PDF */}
          <div className="w-full lg:w-2/3 p-3 sm:p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 flex flex-col h-[60vh] lg:h-full">
            {/* Controles do PDF - escondidos no mobile */}
            {pdfUrl && !isMobile && (
              <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-gray-600/30">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleZoomOut}
                    className="h-8 w-8 p-0 border-gray-600/50 text-gray-300 hover:bg-gray-700"
                  >
                    <ZoomOut size={14} />
                  </Button>
                  <span className="text-xs sm:text-sm text-gray-300 font-mono min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleZoomIn}
                    className="h-8 w-8 p-0 border-gray-600/50 text-gray-300 hover:bg-gray-700"
                  >
                    <ZoomIn size={14} />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRotate}
                    className="h-8 w-8 p-0 border-gray-600/50 text-gray-300 hover:bg-gray-700"
                    title="Rotacionar"
                  >
                    <RotateCw size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrint}
                    className="h-8 w-8 p-0 border-gray-600/50 text-gray-300 hover:bg-gray-700"
                    title="Imprimir"
                  >
                    <Printer size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0 border-gray-600/50 text-gray-300 hover:bg-gray-700"
                    title="Baixar"
                  >
                    <Download size={14} />
                  </Button>
                </div>
              </div>
            )}

            {/* Visualizador PDF */}
            <div className="flex-1 rounded-xl overflow-hidden border border-gray-600/30 bg-white min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-500 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 font-medium text-sm sm:text-base">Carregando PDF...</p>
                    <p className="text-gray-500 text-xs sm:text-sm">Aguarde um momento</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">Erro ao carregar PDF</p>
                    <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">{error}</p>
                    <Button
                      onClick={loadPdf}
                      variant="outline"
                      size="sm"
                      className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white text-xs sm:text-sm"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              ) : pdfUrl ? (
                isMobile ? (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center p-6">
                      <FileText className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-800 font-bold text-lg mb-2">Comprovante Pronto!</p>
                      <p className="text-gray-600 text-sm mb-6">
                        Clique no botão abaixo para visualizar o comprovante
                      </p>
                      <Button
                        onClick={handleOpenInNewTab}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg"
                      >
                        <Eye size={18} className="mr-2" />
                        Abrir PDF
                      </Button>
                      <p className="text-gray-500 text-xs mt-4">
                        O PDF será aberto em uma nova aba
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="w-full h-full border-0 rounded-xl"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      title={`Comprovante - ${receipt.employeeName}`}
                    />
                    {/* Overlay de zoom para melhor UX */}
                    {zoom !== 1 && (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-600/50">
                        <span className="text-white text-xs font-mono">
                          {Math.round(zoom * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 font-medium text-sm sm:text-base">PDF não disponível</p>
                    <p className="text-gray-500 text-xs sm:text-sm">O arquivo não pôde ser carregado</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
