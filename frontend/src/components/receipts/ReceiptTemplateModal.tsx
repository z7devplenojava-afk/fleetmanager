import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X, AlertCircle } from 'lucide-react';
import PaymentReceiptTemplate from './PaymentReceiptTemplate';
import ReceiptTemplateService from '@/services/receiptTemplateService';
import { useToast } from '@/hooks/use-toast';

interface ReceiptTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
  receiptData?: any;
}

export const ReceiptTemplateModal: React.FC<ReceiptTemplateModalProps> = ({
  open,
  onOpenChange,
  receiptId,
  receiptData
}) => {
  const [templateData, setTemplateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && receiptId) {
      loadReceiptTemplate();
    }
  }, [open, receiptId]);

  const loadReceiptTemplate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Se temos dados do recibo, usar eles diretamente
      if (receiptData) {
        const templateData = await ReceiptTemplateService.generateReceiptTemplate(receiptId);
        if (templateData.success && templateData.data) {
          setTemplateData(templateData.data);
        } else {
          throw new Error(templateData.error || 'Erro ao gerar template');
        }
      } else {
        // Buscar dados do recibo na API
        const response = await ReceiptTemplateService.generateReceiptTemplate(receiptId);
        if (response.success && response.data) {
          setTemplateData(response.data);
        } else {
          throw new Error(response.error || 'Erro ao carregar dados do recibo');
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar template do recibo:', err);
      setError(err.message || 'Erro ao carregar template do recibo');
      toast({
        title: "Erro",
        description: "Não foi possível carregar o template do recibo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const blob = await ReceiptTemplateService.downloadReceiptPdf(receiptId);
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprovante_pagamento_${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo foi baixado automaticamente.",
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setTemplateData(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Comprovante de Pagamento</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando template...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-red-600 text-center mb-4">
                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                <p className="font-medium">Erro ao carregar template</p>
                <p className="text-sm text-gray-600 mt-1">{error}</p>
              </div>
              <Button onClick={loadReceiptTemplate} variant="outline">
                Tentar novamente
              </Button>
            </div>
          )}

          {templateData && !loading && (
            <PaymentReceiptTemplate
              data={templateData}
              onPrint={handlePrint}
              onDownload={handleDownload}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptTemplateModal;
