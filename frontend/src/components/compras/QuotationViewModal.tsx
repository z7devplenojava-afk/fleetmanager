import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quotation } from '@/services/quotationService';
import { purchaseRequestService, PurchaseRequest } from '@/services/purchaseRequestService';
import { quotationRfpPdfGenerator, QuotationPhotoItem, QuotationSupplierAttachment, QuotationRfpData } from '@/utils/quotationRfpPdfGenerator';
import { 
  FileText, User, Building2, Calendar, DollarSign, X, Download, Printer, 
  Loader2, Package, ExternalLink, Sparkles, Camera, Image as ImageIcon, Wrench, Car, Eye,
  Paperclip, FileSpreadsheet, ShieldCheck, Clock, Truck, Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuotationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onViewPurchaseRequest?: (purchaseRequestId: string) => void;
}

export function QuotationViewModal({
  isOpen,
  onClose,
  quotation,
  onViewPurchaseRequest,
}: QuotationViewModalProps) {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [linkedPurchaseRequest, setLinkedPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<QuotationPhotoItem | null>(null);

  useEffect(() => {
    if (isOpen && quotation?.purchaseRequestId) {
      loadLinkedPurchaseRequest(quotation.purchaseRequestId);
    } else {
      setLinkedPurchaseRequest(null);
    }
  }, [isOpen, quotation?.purchaseRequestId]);

  const loadLinkedPurchaseRequest = async (requestId: string) => {
    try {
      setLoadingRequest(true);
      const data = await purchaseRequestService.getPurchaseRequestById(requestId);
      setLinkedPurchaseRequest(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da solicitação vinculada:', error);
      setLinkedPurchaseRequest(null);
    } finally {
      setLoadingRequest(false);
    }
  };

  if (!quotation) return null;

  // Extrair metadados e fotos salvos no campo notes em JSON
  let parsedNotesText = quotation.notes || '';
  let parsedPhotos: QuotationPhotoItem[] = [];
  let parsedAttachments: QuotationSupplierAttachment[] = [];
  let parsedPartDetails: any = null;
  let parsedCriteria: any = null;

  if (quotation.notes && quotation.notes.startsWith('{') && (quotation.notes.includes('photos') || quotation.notes.includes('partDetails') || quotation.notes.includes('supplierAttachments'))) {
    try {
      const parsed = JSON.parse(quotation.notes);
      parsedNotesText = parsed.rawNotes || '';
      parsedPhotos = parsed.photos || [];
      parsedAttachments = parsed.supplierAttachments || [];
      parsedPartDetails = parsed.partDetails || null;
      parsedCriteria = parsed.comparisonCriteria || null;
    } catch (e) {
      parsedNotesText = quotation.notes;
    }
  }

  const formatCurrency = (value: number | string) => {
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? parseFloat(value.replace(/\./g, '').replace(',', '.'))
          : 0;
    const numeric = Number.isFinite(numericValue) ? numericValue : 0;
    const rounded = Math.round(numeric * 100) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      SENT: 'Enviada',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      EXPIRED: 'Expirada',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'SENT': return 'bg-indigo-100 text-indigo-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPartQualityLabel = (quality?: string) => {
    switch (quality) {
      case 'ORIGINAL_OEM': return 'Original / Genuína (OEM)';
      case 'PRIMEIRA_LINHA': return '1ª Linha / Premium Certificada';
      case 'PARALELA': return 'Paralela / Reposição Padrão';
      case 'RECONDICIONADA': return 'Recondicionada / Remanufaturada';
      default: return quality || 'Não especificada';
    }
  };

  const getFreightLabel = (freight?: string) => {
    switch (freight) {
      case 'CIF_INCLUSO': return 'CIF (Frete Incluso pelo Fornecedor)';
      case 'FOB_A_PAGAR': return 'FOB (Frete por Conta do Comprador)';
      case 'RETIRADA_LOCAL': return 'Retirada no Balcão / Loja';
      default: return freight || 'Padrão';
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const rfpData: QuotationRfpData = {
        quoteNumber: quotation.quoteNumber,
        title: quotation.title || parsedPartDetails?.itemName || 'Cotação de Peças e Serviços',
        description: quotation.description,
        supplierName: quotation.supplierName,
        totalValue: quotation.totalValue,
        validUntil: quotation.validUntil,
        paymentMethod: quotation.paymentMethod,
        deliveryMethod: quotation.deliveryMethod,
        terms: quotation.terms,
        notes: parsedNotesText,
        createdAt: quotation.createdAt,
        vehiclePlate: parsedPartDetails?.vehiclePlate,
        vehicleModel: parsedPartDetails?.vehicleModel,
        workOrderNumber: parsedPartDetails?.workOrderNumber,
        requesterName: quotation.assignedToName || linkedPurchaseRequest?.requesterName,
        justification: parsedPartDetails?.justification || linkedPurchaseRequest?.justification,
        items: linkedPurchaseRequest?.items?.length ? linkedPurchaseRequest.items.map(item => ({
          itemName: item.itemName,
          itemCode: parsedPartDetails?.itemCode,
          brand: parsedPartDetails?.brand,
          quantity: item.quantity,
          unit: item.unit || 'UN',
          specification: item.specification
        })) : [
          {
            itemName: parsedPartDetails?.itemName || quotation.title,
            itemCode: parsedPartDetails?.itemCode,
            brand: parsedPartDetails?.brand,
            quantity: parsedPartDetails?.quantity || 1,
            unit: parsedPartDetails?.unit || 'UN',
            specification: quotation.description
          }
        ],
        photos: parsedPhotos,
        supplierAttachments: parsedAttachments,
        comparisonCriteria: parsedCriteria
      };

      const blob = await quotationRfpPdfGenerator.generatePDF(rfpData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotacao-${quotation.quoteNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "PDF com fotos e especificações da cotação gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    setIsGeneratingPDF(true);
    try {
      const rfpData: QuotationRfpData = {
        quoteNumber: quotation.quoteNumber,
        title: quotation.title || parsedPartDetails?.itemName || 'Cotação de Peças e Serviços',
        description: quotation.description,
        supplierName: quotation.supplierName,
        totalValue: quotation.totalValue,
        validUntil: quotation.validUntil,
        paymentMethod: quotation.paymentMethod,
        deliveryMethod: quotation.deliveryMethod,
        terms: quotation.terms,
        notes: parsedNotesText,
        createdAt: quotation.createdAt,
        vehiclePlate: parsedPartDetails?.vehiclePlate,
        vehicleModel: parsedPartDetails?.vehicleModel,
        workOrderNumber: parsedPartDetails?.workOrderNumber,
        requesterName: quotation.assignedToName || linkedPurchaseRequest?.requesterName,
        justification: parsedPartDetails?.justification || linkedPurchaseRequest?.justification,
        items: linkedPurchaseRequest?.items?.length ? linkedPurchaseRequest.items.map(item => ({
          itemName: item.itemName,
          itemCode: parsedPartDetails?.itemCode,
          brand: parsedPartDetails?.brand,
          quantity: item.quantity,
          unit: item.unit || 'UN',
          specification: item.specification
        })) : [
          {
            itemName: parsedPartDetails?.itemName || quotation.title,
            itemCode: parsedPartDetails?.itemCode,
            brand: parsedPartDetails?.brand,
            quantity: parsedPartDetails?.quantity || 1,
            unit: parsedPartDetails?.unit || 'UN',
            specification: quotation.description
          }
        ],
        photos: parsedPhotos,
        supplierAttachments: parsedAttachments,
        comparisonCriteria: parsedCriteria
      };

      const blob = await quotationRfpPdfGenerator.generatePDF(rfpData);
      const pdfUrl = URL.createObjectURL(blob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        };
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (error) {
      console.error('Erro ao imprimir PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao imprimir PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-seguranca-lightgray shadow-2xl p-0">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red via-red-600 to-zinc-900 p-6 rounded-t-lg flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                Cotação: {quotation.quoteNumber}
                <Badge className={getStatusColor(quotation.status)}>
                  {getStatusLabel(quotation.status)}
                </Badge>
              </DialogTitle>
              <p className="text-white/80 text-sm mt-0.5">{quotation.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="bg-seguranca-yellow hover:bg-yellow-500 text-zinc-950 font-bold border-none shadow-md flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPDF ? 'Gerando...' : 'Baixar PDF c/ Fotos'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* SEÇÃO: ESPECIFICAÇÕES TÉCNICAS DA PEÇA */}
          {parsedPartDetails && (
            <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Wrench className="h-4 w-4 text-seguranca-red" />
                  </div>
                  Especificações Técnicas da Peça
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block">Peça / Item:</span>
                    <span className="text-white font-semibold text-sm">{parsedPartDetails.itemName || quotation.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Código OEM / Part Number:</span>
                    <span className="text-seguranca-yellow font-mono font-bold text-sm">
                      {parsedPartDetails.itemCode || 'Não especificado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Marca / Linha Recomendada:</span>
                    <span className="text-seguranca-lightgray font-medium text-sm">
                      {parsedPartDetails.brand || 'Original / Primeira Linha'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Quantidade Requisitada:</span>
                    <span className="text-white font-bold text-sm">
                      {parsedPartDetails.quantity || 1} {parsedPartDetails.unit || 'UN'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-700/50 text-xs">
                  <div>
                    <span className="text-gray-400 block flex items-center gap-1">
                      <Car className="h-3 w-3 text-seguranca-yellow" /> Placa do Veículo:
                    </span>
                    <span className="text-seguranca-yellow font-mono font-bold text-sm">
                      {parsedPartDetails.vehiclePlate || 'Não informada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Modelo / Ano:</span>
                    <span className="text-seguranca-lightgray font-medium text-sm">
                      {parsedPartDetails.vehicleModel || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Ordem de Serviço (OS):</span>
                    <span className="text-seguranca-yellow font-mono font-bold text-sm">
                      {parsedPartDetails.workOrderNumber ? `#${parsedPartDetails.workOrderNumber}` : '-'}
                    </span>
                  </div>
                </div>

                {parsedPartDetails.justification && (
                  <div className="p-2.5 bg-black/40 rounded border border-gray-800 text-xs">
                    <span className="text-seguranca-yellow font-semibold">Motivo da Troca / Sintomas: </span>
                    <span className="text-gray-300 italic">"{parsedPartDetails.justification}"</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO: FOTOS DA PEÇA A SER TROCADA */}
          {parsedPhotos.length > 0 && (
            <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Camera className="h-4 w-4 text-seguranca-red" />
                  </div>
                  Galeria de Fotos da Peça Danificada / Amostra ({parsedPhotos.length})
                </CardTitle>
                <span className="text-xs text-gray-400">Clique na foto para ampliar</span>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {parsedPhotos.map((photo) => (
                    <div 
                      key={photo.id}
                      onClick={() => setPreviewPhoto(photo)}
                      className="group relative bg-black/50 border border-gray-700 hover:border-seguranca-yellow rounded-lg overflow-hidden cursor-pointer shadow transition-all duration-200"
                    >
                      <div className="h-32 w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={photo.name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                      </div>
                      <div className="p-2 bg-zinc-900/90 flex items-center justify-between">
                        <span className="text-[11px] text-gray-300 truncate max-w-[120px]" title={photo.name}>
                          {photo.name}
                        </span>
                        <Eye className="h-3.5 w-3.5 text-seguranca-yellow opacity-80 group-hover:opacity-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO: ARQUIVOS & PROPOSTAS DO FORNECEDOR (PDF / EXCEL) */}
          {parsedAttachments.length > 0 && (
            <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <Paperclip className="h-4 w-4 text-blue-400" />
                  </div>
                  Propostas Oficiais do Fornecedor ({parsedAttachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {parsedAttachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      download={att.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-gray-700 hover:border-seguranca-yellow rounded-lg transition-colors group text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {att.type === 'pdf' ? (
                          <div className="p-1.5 bg-red-500/20 text-red-400 rounded">
                            <FileText className="h-4 w-4" />
                          </div>
                        ) : att.type === 'excel' ? (
                          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded">
                            <FileSpreadsheet className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-white group-hover:text-seguranca-yellow truncate">{att.name}</p>
                          <span className="text-[10px] text-gray-400">{att.size || 'Arquivo anexo'}</span>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-gray-400 group-hover:text-seguranca-yellow flex-shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO: VARIÁVEIS DE COMPARAÇÃO & DECISÃO AUTOMÁTICA */}
          {parsedCriteria && (
            <Card className="bg-gradient-to-r from-zinc-900 to-seguranca-graphite border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                    <Award className="h-4 w-4 text-emerald-400" />
                  </div>
                  Variáveis de Decisão do Compras (Análise Automática da Melhor Opção)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-zinc-950/60 rounded border border-gray-800">
                    <span className="text-gray-400 block flex items-center gap-1">
                      <Clock className="h-3 w-3 text-seguranca-yellow" /> Prazo de Entrega:
                    </span>
                    <span className="text-white font-bold text-sm">
                      {parsedCriteria.deliveryDays ? `${parsedCriteria.deliveryDays} dia(s) úteis` : 'Imediato'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/60 rounded border border-gray-800">
                    <span className="text-gray-400 block flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-blue-400" /> Garantia Oferecida:
                    </span>
                    <span className="text-white font-bold text-sm">
                      {parsedCriteria.warrantyMonths ? `${parsedCriteria.warrantyMonths} meses` : 'Padrão (3 meses)'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/60 rounded border border-gray-800">
                    <span className="text-gray-400 block flex items-center gap-1">
                      <Truck className="h-3 w-3 text-emerald-400" /> Condição do Frete:
                    </span>
                    <span className="text-white font-bold text-sm">
                      {getFreightLabel(parsedCriteria.freightType)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-950/60 rounded border border-gray-800">
                    <span className="text-gray-400 block flex items-center gap-1">
                      <Award className="h-3 w-3 text-purple-400" /> Qualidade da Peça:
                    </span>
                    <span className="text-white font-bold text-sm">
                      {getPartQualityLabel(parsedCriteria.partQuality)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO: DETALHES COMERCIAIS DA COTAÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-zinc-900 border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-seguranca-yellow" />
                  Fornecedor & Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 block">Razão Social / Nome Fantasia:</span>
                  <span className="text-white font-semibold text-sm">{quotation.supplierName || 'Aguardando Fornecedor'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-gray-400 block">Forma de Pagamento:</span>
                    <span className="text-seguranca-lightgray">{quotation.paymentMethod || 'A combinar'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Método de Envio / Entrega:</span>
                    <span className="text-seguranca-lightgray">{quotation.deliveryMethod || 'A combinar'}</span>
                  </div>
                </div>
                {quotation.terms && (
                  <div className="pt-1">
                    <span className="text-gray-400 block">Condições Comerciais:</span>
                    <span className="text-seguranca-lightgray">{quotation.terms}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Valores & Validade
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="p-3 bg-black/40 rounded-lg border border-gray-800 flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Valor Total da Cotação:</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {quotation.totalValue && quotation.totalValue > 0 ? formatCurrency(quotation.totalValue) : 'Aguardando Proposta'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 block flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" /> Data de Criação:
                    </span>
                    <span className="text-seguranca-lightgray">{formatDate(quotation.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-seguranca-yellow" /> Validade da Proposta:
                    </span>
                    <span className="text-seguranca-yellow font-semibold">{formatDate(quotation.validUntil)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEÇÃO: SOLICITAÇÃO DE COMPRA VINCULADA */}
          {quotation.purchaseRequestId && (
            <Card className="bg-zinc-900 border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                  <Package className="h-4 w-4 text-seguranca-yellow" />
                  Origem: Requisição / Solicitação de Compra
                </CardTitle>
                {onViewPurchaseRequest && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPurchaseRequest(quotation.purchaseRequestId!)}
                    className="text-seguranca-yellow hover:text-yellow-400 text-xs p-0 h-auto flex items-center gap-1"
                  >
                    Abrir Solicitação
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-2">
                {loadingRequest ? (
                  <div className="flex items-center gap-2 text-gray-400 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando dados da requisição...
                  </div>
                ) : linkedPurchaseRequest ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-gray-400 block">Número da Solicitação:</span>
                        <span className="text-white font-mono font-bold text-sm">
                          {linkedPurchaseRequest.requestNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Solicitante:</span>
                        <span className="text-seguranca-lightgray font-medium">
                          {linkedPurchaseRequest.requesterName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Departamento:</span>
                        <span className="text-seguranca-lightgray">
                          {linkedPurchaseRequest.department}
                        </span>
                      </div>
                    </div>
                    {linkedPurchaseRequest.items && linkedPurchaseRequest.items.length > 0 && (
                      <div className="mt-3">
                        <span className="text-gray-400 block mb-1">Itens Requisitados pelo Almoxarifado / Oficina:</span>
                        <div className="bg-black/30 rounded border border-gray-800 divide-y divide-gray-800">
                          {linkedPurchaseRequest.items.map((item, idx) => (
                            <div key={idx} className="p-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-white font-medium">{item.itemName}</span>
                                {item.specification && (
                                  <span className="text-gray-400 block text-[11px]">{item.specification}</span>
                                )}
                              </div>
                              <span className="text-seguranca-yellow font-bold">
                                {item.quantity} {item.unit || 'UN'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400">
                    ID da Solicitação Vinculada: <span className="font-mono text-gray-300">{quotation.purchaseRequestId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO: OBSERVAÇÕES */}
          {parsedNotesText && (
            <Card className="bg-zinc-900 border-gray-700 shadow-md">
              <CardHeader className="pb-3 border-b border-gray-700/60">
                <CardTitle className="text-base font-semibold text-seguranca-lightgray">
                  Observações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs text-gray-300 whitespace-pre-wrap">
                {parsedNotesText}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-4 bg-zinc-900 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="bg-seguranca-yellow hover:bg-yellow-500 text-zinc-950 font-bold border-none shadow-md flex items-center gap-2"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Baixar PDF com Fotos
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isGeneratingPDF}
              className="border-gray-600 text-seguranca-lightgray hover:bg-zinc-800 hover:text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-zinc-800 hover:text-white w-full sm:w-auto"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>

      {/* Modal / Dialog de Zoom de Foto */}
      {previewPhoto && (
        <Dialog open={true} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-4xl bg-zinc-950 border-gray-700 p-2 text-white">
            <DialogHeader className="p-3 border-b border-gray-800 flex flex-row items-center justify-between">
              <DialogTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-seguranca-yellow" />
                {previewPhoto.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4 bg-black/60 rounded max-h-[75vh] overflow-hidden">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
            <div className="flex justify-end p-2 border-t border-gray-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewPhoto(null)}
                className="bg-zinc-800 border-gray-600 text-white"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
