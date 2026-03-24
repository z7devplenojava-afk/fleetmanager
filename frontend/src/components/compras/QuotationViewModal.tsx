import React, { useState } from 'react';
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
import { FileText, User, Building2, Calendar, DollarSign, X, Download, Printer, Loader2, Package, ExternalLink } from 'lucide-react';
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

  if (!quotation) return null;

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

  const generatePDFDocument = async (): Promise<{ doc: any; blob: Blob }> => {
    const jsPDF = (await import('jspdf')).default;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Cotação de Compra', margin, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${quotation.quoteNumber}`, margin, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - margin - 60, 20);

    // Informações Básicas
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações Básicas', margin, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const basicInfo = [
      ['Título:', quotation.title || '-'],
      ['Status:', getStatusLabel(quotation.status)],
      ['Valor Total:', formatCurrency(quotation.totalValue)],
      ['Válida Até:', formatDate(quotation.validUntil)],
      ['Data de Criação:', formatDate(quotation.createdAt)],
    ];

    basicInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal');
      const textWidth = doc.getTextWidth(value);
      doc.text(value, margin + 50, yPos);
      yPos += 6;
    });

    if (quotation.description) {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Descrição:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(quotation.description, pageWidth - 2 * margin);
      descLines.forEach((line: string) => {
        doc.text(line, margin, yPos);
        yPos += 5;
      });
    }

    // Informações de Fornecedor
    if (quotation.supplierName) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Informações de Fornecedor', margin, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const supplierInfo = [
        ['Fornecedor:', quotation.supplierName],
        ['Método de Pagamento:', quotation.paymentMethod || '-'],
        ['Método de Entrega:', quotation.deliveryMethod || '-'],
      ];

      supplierInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 50, yPos);
        yPos += 6;
      });

      if (quotation.terms) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Condições:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const termsLines = doc.splitTextToSize(quotation.terms, pageWidth - 2 * margin);
        termsLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }
    }

    // Responsável
    if (quotation.assignedToName) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Responsável', margin, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setFont('helvetica', 'bold');
      doc.text('Responsável pela Cotação:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(quotation.assignedToName, margin + 50, yPos);
      yPos += 6;
    }

    // Solicitação de Compra Relacionada
    if (quotation.purchaseRequestNumber) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Solicitação de Compra Relacionada', margin, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setFont('helvetica', 'bold');
      doc.text('Número:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(quotation.purchaseRequestNumber, margin + 50, yPos);
      yPos += 6;
      if (quotation.purchaseRequestTitle) {
        doc.setFont('helvetica', 'bold');
        doc.text('Título:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        const titleLines = doc.splitTextToSize(quotation.purchaseRequestTitle, pageWidth - 2 * margin - 50);
        titleLines.forEach((line: string) => {
          doc.text(line, margin + 50, yPos);
          yPos += 5;
        });
      }
    }

    // Observações
    if (quotation.notes) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações Adicionais', margin, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - 2 * margin);
      notesLines.forEach((line: string) => {
        doc.text(line, margin, yPos);
        yPos += 5;
      });
    }

    // Gerar blob do PDF
    const pdfBlob = doc.output('blob');
    
    return { doc, blob: pdfBlob };
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const { doc } = await generatePDFDocument();
      
      // Salvar PDF
      const fileName = `cotacao-${quotation.quoteNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!",
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
      const { blob } = await generatePDFDocument();
      
      // Criar URL do blob
      const pdfUrl = URL.createObjectURL(blob);
      
      // Abrir PDF em nova janela e imprimir
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Limpar URL após um tempo
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        };
      } else {
        // Se popup foi bloqueado, tentar abrir diretamente
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              Visualizar Cotação de Compra
            </DialogTitle>
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

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-5 w-5 text-seguranca-red" />
                </div>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Número da Cotação</label>
                  <p className="text-seguranca-lightgray font-medium">{quotation.quoteNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(quotation.status)}>
                      {getStatusLabel(quotation.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Título</label>
                  <p className="text-seguranca-lightgray font-medium">{quotation.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Valor Total</label>
                  <p className="text-seguranca-lightgray font-semibold">
                    {formatCurrency(quotation.totalValue)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Válida Até</label>
                  <p className="text-seguranca-lightgray">{formatDate(quotation.validUntil)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Data de Criação</label>
                  <p className="text-seguranca-lightgray">{formatDate(quotation.createdAt)}</p>
                </div>
              </div>
              {quotation.description && (
                <div>
                  <label className="text-sm text-gray-400">Descrição</label>
                  <p className="text-seguranca-lightgray mt-1">{quotation.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Fornecedor */}
          {quotation.supplierName && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Building2 className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Informações de Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Fornecedor</label>
                    <p className="text-seguranca-lightgray font-medium">{quotation.supplierName}</p>
                  </div>
                  {quotation.paymentMethod && (
                    <div>
                      <label className="text-sm text-gray-400">Método de Pagamento</label>
                      <p className="text-seguranca-lightgray">{quotation.paymentMethod}</p>
                    </div>
                  )}
                  {quotation.deliveryMethod && (
                    <div>
                      <label className="text-sm text-gray-400">Método de Entrega</label>
                      <p className="text-seguranca-lightgray">{quotation.deliveryMethod}</p>
                    </div>
                  )}
                  {quotation.terms && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400">Condições</label>
                      <p className="text-seguranca-lightgray mt-1">{quotation.terms}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Responsável pela Cotação */}
          {quotation.assignedToName && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <User className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Responsável pela Cotação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm text-gray-400">Responsável</label>
                  <p className="text-seguranca-lightgray font-medium">{quotation.assignedToName}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solicitação de Compra Relacionada */}
          {quotation.purchaseRequestNumber && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Package className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Solicitação de Compra Relacionada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Número da Solicitação</label>
                    <p className="text-seguranca-lightgray font-medium">{quotation.purchaseRequestNumber}</p>
                  </div>
                  {quotation.purchaseRequestTitle && (
                    <div>
                      <label className="text-sm text-gray-400">Título</label>
                      <p className="text-seguranca-lightgray">{quotation.purchaseRequestTitle}</p>
                    </div>
                  )}
                  {quotation.purchaseRequestId && onViewPurchaseRequest && (
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPurchaseRequest(quotation.purchaseRequestId!)}
                        className="text-seguranca-yellow hover:text-seguranca-yellow hover:bg-seguranca-yellow/10"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar Solicitação de Compra
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {quotation.notes && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <FileText className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Observações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-seguranca-lightgray">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-600">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

