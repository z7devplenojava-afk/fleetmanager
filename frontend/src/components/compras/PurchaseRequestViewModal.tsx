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
import { PurchaseRequest } from '@/services/purchaseRequestService';
import { FileText, User, Building2, Calendar, DollarSign, CheckCircle, X, Download, Printer, Loader2, Package, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Lazy import para evitar ciclo de dependência com QuotationFormModal
const QuotationFormModal = React.lazy(() => import('@/components/QuotationFormModal'));

interface PurchaseRequestViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PurchaseRequest | undefined;
  onQuotationCreated?: () => void;
}

export function PurchaseRequestViewModal({
  isOpen,
  onClose,
  request,
  onQuotationCreated,
}: PurchaseRequestViewModalProps) {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  if (!request) return null;

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
      SUBMITTED: 'Enviada',
      PENDING: 'Pendente',
      IN_PROCESS: 'Em Processo',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'SUBMITTED': return 'bg-indigo-100 text-indigo-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROCESS': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      URGENT: 'Urgente',
      HIGH: 'Alta',
      MEDIUM: 'Média',
      LOW: 'Baixa',
    };
    return labels[priority] || priority;
  };

  const getUrgencyLabel = (urgency: string) => {
    const labels: Record<string, string> = {
      CRITICAL: 'Crítica',
      URGENT: 'Urgente',
      NORMAL: 'Normal',
      LOW: 'Baixa',
    };
    return labels[urgency] || urgency;
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = await import('jspdf-autotable');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Solicitação de Compra', margin, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Número: ${request.requestNumber}`, margin, yPos);
      
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
        ['Título:', request.title || '-'],
        ['Status:', getStatusLabel(request.status)],
        ['Prioridade:', getPriorityLabel(request.priority)],
        ['Urgência:', getUrgencyLabel(request.urgency)],
        ['Data da Solicitação:', formatDate(request.requestDate)],
        ['Data Necessária:', formatDate(request.requiredDate)],
        ['Valor Estimado:', formatCurrency(request.totalValue || request.estimatedTotal || 0)],
      ];

      basicInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        const textWidth = doc.getTextWidth(value);
        doc.text(value, margin + 50, yPos);
        yPos += 6;
      });

      if (request.description) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Descrição:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(request.description, pageWidth - 2 * margin);
        descLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }

      if (request.justification) {
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Justificativa:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const justLines = doc.splitTextToSize(request.justification, pageWidth - 2 * margin);
        justLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }

      // Solicitante e Departamento
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Solicitante e Departamento', margin, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const requesterInfo = [
        ['Solicitante:', request.requesterName || '-'],
        ['Departamento:', request.department || '-'],
        ['Unidade Organizacional:', request.unitName || '-'],
      ];

      requesterInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 50, yPos);
        yPos += 6;
      });

      // Informações de Aprovação
      if (request.status === 'APPROVED' || request.approverName || request.approvedBy) {
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Informações de Aprovação', margin, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const approvalInfo = [
          ['Aprovador por:', request.approverName || request.approvedBy || '-'],
          ['Data de Aprovação:', formatDate(request.approvalDate)],
        ];

        approvalInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 50, yPos);
          yPos += 6;
        });

        if (request.approvalNotes) {
          yPos += 3;
          doc.setFont('helvetica', 'bold');
          doc.text('Observações da Aprovação:', margin, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const notesLines = doc.splitTextToSize(request.approvalNotes, pageWidth - 2 * margin);
          notesLines.forEach((line: string) => {
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        }
      }

      // Informações de Fornecedor
      if (request.supplier) {
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Informações de Fornecedor', margin, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const supplierInfo = [
          ['Fornecedor:', request.supplier],
          ['Método de Pagamento:', request.paymentMethod || '-'],
          ['Método de Entrega:', request.deliveryMethod || '-'],
        ];

        supplierInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 50, yPos);
          yPos += 6;
        });

        if (request.deliveryAddress) {
          yPos += 3;
          doc.setFont('helvetica', 'bold');
          doc.text('Endereço de Entrega:', margin, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          const addressLines = doc.splitTextToSize(request.deliveryAddress, pageWidth - 2 * margin);
          addressLines.forEach((line: string) => {
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        }
      }

      // Observações
      if (request.notes) {
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Observações Adicionais', margin, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(request.notes, pageWidth - 2 * margin);
        notesLines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }

      // Salvar PDF
      const fileName = `solicitacao-compra-${request.requestNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const handlePrint = () => {
    window.print();
  };

  const canRequestQuotation = !['CANCELLED', 'REJECTED', 'COMPLETED'].includes(request.status);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-6 -m-6 mb-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              Visualizar Solicitação de Compra
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
                  <label className="text-sm text-gray-400">Número da Requisição</label>
                  <p className="text-seguranca-lightgray font-medium">{request.requestNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Título</label>
                  <p className="text-seguranca-lightgray font-medium">{request.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Prioridade</label>
                  <div className="mt-1">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {getPriorityLabel(request.priority)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Urgência</label>
                  <p className="text-seguranca-lightgray">{getUrgencyLabel(request.urgency) || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Data Necessária</label>
                  <p className="text-seguranca-lightgray">{formatDate(request.requiredDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Valor Estimado</label>
                  <p className="text-seguranca-lightgray font-semibold">
                    {formatCurrency(request.totalValue || request.estimatedTotal || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Data da Solicitação</label>
                  <p className="text-seguranca-lightgray">{formatDate(request.requestDate)}</p>
                </div>
              </div>
              {request.description && (
                <div>
                  <label className="text-sm text-gray-400">Descrição</label>
                  <p className="text-seguranca-lightgray mt-1">{request.description}</p>
                </div>
              )}
              {request.justification && (
                <div>
                  <label className="text-sm text-gray-400">Justificativa</label>
                  <p className="text-seguranca-lightgray mt-1">{request.justification}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens da Solicitação */}
          {(request.items && request.items.length > 0) && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <Package className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Itens da Solicitação
                  <Badge className="ml-2 bg-seguranca-red/20 text-seguranca-red border border-seguranca-red/30">
                    {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-600">
                        <th className="py-2 pr-3">Peça / Item</th>
                        <th className="py-2 pr-3 text-center w-20">Qtd</th>
                        <th className="py-2 pr-3 text-right w-28">Unitário</th>
                        <th className="py-2 pr-3 text-right w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/60">
                      {request.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-seguranca-black/30 transition-colors">
                          <td className="py-2 pr-3">
                            <div className="text-seguranca-lightgray font-medium">{item.itemName}</div>
                            {item.specification && (
                              <div className="text-xs text-gray-400 mt-0.5">{item.specification}</div>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-center text-seguranca-lightgray">
                            {typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 0)}
                          </td>
                          <td className="py-2 pr-3 text-right text-gray-300">
                            {formatCurrency(item.unitPrice || 0)}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-seguranca-lightgray font-semibold">
                            {formatCurrency(item.totalPrice || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-600">
                        <td colSpan={3} className="py-2 pr-3 text-right text-gray-400 font-medium">Total estimado</td>
                        <td className="py-2 pr-3 text-right font-mono font-bold text-seguranca-lightgray">
                          {formatCurrency(request.totalValue || request.estimatedTotal || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solicitante e Departamento */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-5 w-5 text-seguranca-red" />
                </div>
                Solicitante e Departamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Solicitante</label>
                  <p className="text-seguranca-lightgray font-medium">{request.requesterName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Departamento</label>
                  <p className="text-seguranca-lightgray">{request.department || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Unidade Organizacional</label>
                  <p className="text-seguranca-lightgray">{request.unitName || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Aprovação */}
          {(request.status === 'APPROVED' || request.approverName || request.approvedBy) && (
            <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-seguranca-lightgray flex items-center gap-2">
                  <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-seguranca-red" />
                  </div>
                  Informações de Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Aprovador por</label>
                    <p className="text-seguranca-lightgray font-medium">
                      {request.approverName || request.approvedBy || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Data de Aprovação</label>
                    <p className="text-seguranca-lightgray">{formatDate(request.approvalDate)}</p>
                  </div>
                  {request.approvalNotes && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400">Observações da Aprovação</label>
                      <p className="text-seguranca-lightgray mt-1">{request.approvalNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações de Fornecedor */}
          {request.supplier && (
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
                    <p className="text-seguranca-lightgray">{request.supplier}</p>
                  </div>
                  {request.paymentMethod && (
                    <div>
                      <label className="text-sm text-gray-400">Método de Pagamento</label>
                      <p className="text-seguranca-lightgray">{request.paymentMethod}</p>
                    </div>
                  )}
                  {request.deliveryMethod && (
                    <div>
                      <label className="text-sm text-gray-400">Método de Entrega</label>
                      <p className="text-seguranca-lightgray">{request.deliveryMethod}</p>
                    </div>
                  )}
                  {request.deliveryAddress && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400">Endereço de Entrega</label>
                      <p className="text-seguranca-lightgray">{request.deliveryAddress}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {request.notes && (
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
                <p className="text-seguranca-lightgray">{request.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-600">
          <div className="flex gap-2">
            <Button
              onClick={() => setIsQuotationModalOpen(true)}
              disabled={!canRequestQuotation}
              title={!canRequestQuotation ? "Não é possível cotar uma solicitação cancelada, rejeitada ou concluída" : "Criar cotação para esta solicitação"}
              className="bg-seguranca-red hover:bg-red-700 text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Nova Cotação
            </Button>
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

      {/* Modal Nova Cotação — abre com a solicitação já selecionada */}
      {isQuotationModalOpen && request && (
        <React.Suspense fallback={null}>
          <QuotationFormModal
            initialPurchaseRequestId={request.id}
            onClose={() => setIsQuotationModalOpen(false)}
            onCreated={() => onQuotationCreated?.()}
          />
        </React.Suspense>
      )}
    </>
  );
}

