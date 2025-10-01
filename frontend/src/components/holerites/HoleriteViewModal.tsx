import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Mail, Download, Calendar, User, MessageSquare, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { payslipService } from '@/services/payslipService';

interface Payslip {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  fileName: string;
  processedAt: string;
}

interface HoleriteViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: Payslip | null;
  onDownload: () => void;
  onSendEmail: () => void;
  onSendWhatsApp?: () => void;
}

export const HoleriteViewModal: React.FC<HoleriteViewModalProps> = ({
  open,
  onOpenChange,
  payslip,
  onDownload,
  onSendEmail,
  onSendWhatsApp
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 HoleriteViewModal - useEffect triggered:', { open, payslip: payslip?.fileName });
    if (open && payslip) {
      loadPdf();
    }
  }, [open, payslip]);

  const loadPdf = async () => {
    if (!payslip) return;
    
    console.log('🔍 HoleriteViewModal - Iniciando carregamento do PDF:', payslip.fileName);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📥 HoleriteViewModal - Chamando payslipService.downloadPayslip...');
      const blob = await payslipService.downloadPayslip(payslip.fileName);
      console.log('✅ HoleriteViewModal - PDF baixado com sucesso, tamanho:', blob.size, 'bytes');
      
      const url = window.URL.createObjectURL(blob);
      console.log('🔗 HoleriteViewModal - URL criada:', url);
      setPdfUrl(url);
    } catch (err) {
      console.error('❌ HoleriteViewModal - Erro ao carregar PDF:', err);
      setError('Erro ao carregar o PDF do holerite. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setZoom(1);
    setRotation(0);
    setError(null);
    onOpenChange(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!payslip) return null;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] h-[95vh] sm:w-[90vw] sm:h-[90vh] lg:max-w-6xl lg:max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-seguranca-graphite via-gray-800 to-seguranca-black border border-gray-600/50 mx-2 sm:mx-auto shadow-2xl">
        {/* Header Otimizado e Responsivo */}
        <DialogHeader className="relative p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-gray-800 border-b border-gray-600/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-4">
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2 sm:gap-3 lg:gap-4 text-base sm:text-lg lg:text-xl">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-seguranca-yellow to-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="text-seguranca-black" size={16} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-seguranca-red rounded-full border-2 border-seguranca-graphite"></div>
              </div>
              <div className="flex flex-col leading-tight min-w-0 flex-1">
                <span className="break-words font-bold bg-gradient-to-r from-seguranca-lightgray to-white bg-clip-text text-transparent text-xs sm:text-sm lg:text-base">
                  Visualização do Holerite
                </span>
                <div className="text-xs sm:text-sm text-gray-400 font-normal flex items-center gap-1 sm:gap-2 mt-0">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 bg-seguranca-yellow rounded-full flex-shrink-0"></div>
                  <span className="truncate text-xs sm:text-sm">{payslip.employeeName} - {payslip.month}/{payslip.year}</span>
                </div>
              </div>
            </DialogTitle>
            
            {/* Controles de visualização otimizados */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 bg-seguranca-black/50 rounded-lg sm:rounded-xl p-1 sm:p-1.5 border border-gray-600/30">
              <Button
                size="sm"
                variant="outline"
                onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
                disabled={!pdfUrl}
                className="border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-200 h-6 w-6 sm:h-7 sm:w-7 p-0"
                title="Abrir em nova aba"
              >
                <FileText size={10} className="sm:w-3 sm:h-3" />
              </Button>
              
              <div className="flex items-center gap-0.5 bg-seguranca-graphite rounded-md sm:rounded-lg px-1 py-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-gray-400 hover:text-white hover:bg-seguranca-yellow/20"
                >
                  <ZoomOut size={8} className="sm:w-3 sm:h-3" />
                </Button>
                
                <span className="text-xs text-seguranca-yellow font-mono min-w-[35px] sm:min-w-[45px] text-center bg-seguranca-black/50 px-1 py-0.5 rounded text-[9px] sm:text-xs">
                  {Math.round(zoom * 100)}%
                </span>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-gray-400 hover:text-white hover:bg-seguranca-yellow/20"
                >
                  <ZoomIn size={8} className="sm:w-3 sm:h-3" />
                </Button>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleRotate}
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200 h-6 w-6 sm:h-7 sm:w-7 p-0"
                title="Rotacionar"
              >
                <RotateCw size={10} className="sm:w-3 sm:h-3" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="border-gray-500/50 text-gray-400 hover:bg-gray-600 hover:text-white transition-all duration-200 h-6 w-6 sm:h-7 sm:w-7 p-0 text-[9px] sm:text-xs"
                title="Resetar"
              >
                <span className="hidden sm:inline">R</span>
                <span className="sm:hidden text-[8px]">R</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Informações do Funcionário - Compacto e Responsivo */}
          <div className="px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 pb-2 sm:pb-3 bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-seguranca-black border-b border-gray-600/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-seguranca-graphite/50 rounded-lg border border-gray-600/30 hover:border-seguranca-yellow/30 transition-colors duration-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-seguranca-yellow to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-seguranca-black sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Funcionário</span>
                  <span className="text-seguranca-lightgray font-semibold truncate text-xs sm:text-sm lg:text-base">{payslip.employeeName}</span>
                </div>
              </div>
              
              {payslip.cpf && (
                <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-seguranca-graphite/50 rounded-lg border border-gray-600/30 hover:border-green-500/30 transition-colors duration-200">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[10px] sm:text-xs">ID</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">CPF</span>
                    <span className="text-seguranca-lightgray font-mono text-[10px] sm:text-xs">{payslip.cpf}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-seguranca-graphite/50 rounded-lg border border-gray-600/30 hover:border-blue-500/30 transition-colors duration-200 sm:col-span-2 lg:col-span-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={12} className="text-white sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wide">Período</span>
                  <span className="text-seguranca-lightgray font-semibold text-xs sm:text-sm lg:text-base">{payslip.month}/{payslip.year}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Área do PDF - Otimizada e Responsiva */}
          <div className="flex-1 bg-gradient-to-br from-seguranca-black via-gray-900 to-seguranca-black p-1 sm:p-2 lg:p-4 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-seguranca-yellow/20 mx-auto mb-4 sm:mb-6"></div>
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-transparent border-t-seguranca-yellow absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-seguranca-lightgray text-sm sm:text-lg font-semibold">Carregando PDF...</p>
                    <p className="text-gray-400 text-xs sm:text-sm">Preparando visualização do holerite</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
                      <X size={32} className="text-red-500 sm:w-10 sm:h-10" />
                    </div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-red-400 text-base sm:text-lg font-semibold mb-1 sm:mb-2">Erro ao carregar PDF</p>
                      <p className="text-gray-400 text-xs sm:text-sm">{error}</p>
                    </div>
                    <Button 
                      onClick={loadPdf} 
                      variant="outline" 
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 text-xs sm:text-sm"
                    >
                      <RotateCw size={14} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-seguranca-black rounded-lg sm:rounded-xl overflow-hidden border border-gray-600/30 shadow-2xl">
                <div className="relative w-full h-full">
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full h-full border-0 rounded-lg sm:rounded-xl"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                  {/* Overlay de zoom para melhor UX */}
                  {zoom !== 1 && (
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-seguranca-black/80 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2 border border-gray-600/50">
                      <span className="text-seguranca-yellow text-xs sm:text-sm font-mono">
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-gray-600/30">
                    <FileText size={24} className="text-gray-500 sm:w-8 sm:h-8" />
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base">Nenhum PDF disponível</p>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação - Compactos e Responsivos */}
          <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-seguranca-black border-t border-gray-600/50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-center">
              {/* Botão Fechar */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClose}
                className="border-gray-500/50 text-gray-400 hover:bg-gray-600 hover:text-white transition-all duration-200 order-1 sm:order-none w-full sm:w-auto text-xs sm:text-sm"
              >
                <X size={12} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                <span>Fechar</span>
              </Button>
              
              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-none w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onSendEmail}
                  className="border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-200 shadow-lg shadow-green-500/10 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Mail size={12} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Enviar Email</span>
                  <span className="sm:hidden">Email</span>
                </Button>
                
                {onSendWhatsApp && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onSendWhatsApp}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200 shadow-lg shadow-blue-500/10 w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <MessageSquare size={12} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Enviar WhatsApp</span>
                    <span className="sm:hidden">WhatsApp</span>
                  </Button>
                )}
                
                <Button 
                  size="sm"
                  onClick={onDownload}
                  className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-darkred hover:to-red-700 transition-all duration-200 shadow-lg shadow-seguranca-red/20 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Download size={12} className="mr-1 sm:mr-2 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">Download</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
