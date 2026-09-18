import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  CreditCard,
  Truck,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { procurementService, ProcurementPurchaseOrder } from '@/services/procurementService';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: ProcurementPurchaseOrder | null;
  onStatusUpdated?: () => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onStatusUpdated
}) => {
  const { toast } = useToast();
  const [financialNotes, setFinancialNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!purchaseOrder) return null;

  const isEmergency = purchaseOrder.urgency === 'EMERGENCIA';

  const handleFinancialDecision = async (approved: boolean) => {
    try {
      setSubmitting(true);
      await procurementService.financialApproval({
        purchaseOrderId: purchaseOrder.id,
        approved,
        financialNotes
      });

      toast({
        title: approved ? 'Ordem de Compra Aprovada!' : 'Ordem de Compra Recusada',
        description: approved
          ? 'Autorização financeira concluída. Status alterado para Em Trânsito.'
          : 'A Ordem de Compra foi cancelada e a requisição informada.',
        variant: approved ? 'default' : 'destructive'
      });

      if (onStatusUpdated) {
        onStatusUpdated();
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao processar aprovação',
        description: error?.response?.data?.message || 'Falha ao comunicar com o servidor.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-100">
              <FileText className="w-5 h-5 text-amber-500" />
              Ordem de Compra — {purchaseOrder.ocNumber}
            </DialogTitle>
            {isEmergency ? (
              <Badge className="bg-red-600 text-white font-bold animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> EMERGÊNCIA
              </Badge>
            ) : (
              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                NORMAL
              </Badge>
            )}
          </div>
          <DialogDescription className="text-zinc-400">
            Requisição: <span className="font-semibold text-zinc-200">{purchaseOrder.requisitionNumber}</span> | OS:{' '}
            <span className="font-semibold text-zinc-200">{purchaseOrder.workOrderNumber || 'N/D'}</span> | Veículo:{' '}
            <span className="font-semibold text-zinc-200">{purchaseOrder.vehiclePlate || 'N/D'}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Alerta se for emergencial */}
          {isEmergency && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-zinc-300">
                <strong className="text-red-300">Compra de Reposição Emergencial:</strong> Veículo paralisado na
                operação aguardando esta peça para liberação imediata. Prioridade máxima de faturamento e entrega.
              </div>
            </div>
          )}

          {/* Dados do Fornecedor e Valores */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-800/60 border border-zinc-700/60 rounded-lg">
            <div>
              <span className="text-xs text-zinc-400">Fornecedor Vencedor</span>
              <p className="text-sm font-bold text-zinc-100">{purchaseOrder.supplierName}</p>
              {purchaseOrder.supplierCnpj && (
                <p className="text-xs text-zinc-400">CNPJ: {purchaseOrder.supplierCnpj}</p>
              )}
            </div>
            <div>
              <span className="text-xs text-zinc-400">Condições de Pagamento</span>
              <p className="text-sm font-bold text-amber-400">{purchaseOrder.paymentTerms}</p>
            </div>
          </div>

          {/* Dados do Item */}
          <div className="p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-zinc-200">
                {purchaseOrder.quantity}x {purchaseOrder.itemName}
              </span>
              <span className="font-bold text-emerald-400">
                R$ {(purchaseOrder.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-xs text-zinc-400">
              Valor Unitário: R$ {(purchaseOrder.unitPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Justificativa */}
          <div>
            <Label className="text-xs text-zinc-400 font-medium">Justificativa da Compra</Label>
            <p className="p-3 mt-1 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
              {purchaseOrder.justification}
            </p>
          </div>

          {/* Status Atual */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/80 rounded-lg border border-zinc-700">
            <span className="text-xs text-zinc-400">Status da OC:</span>
            <Badge className="bg-amber-600 text-white font-semibold">
              {purchaseOrder.statusDescription || purchaseOrder.status}
            </Badge>
          </div>

          {/* Parecer Financeiro se estiver pendente */}
          {purchaseOrder.status === 'PENDING_FINANCIAL_APPROVAL' && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <Label className="text-xs text-zinc-300 font-medium">Parecer / Observações do Financeiro</Label>
              <Textarea
                rows={2}
                placeholder="Ex: Pagamento autorizado via boleto faturado 30/60 dias conforme aprovado..."
                className="bg-zinc-800 border-zinc-700 text-xs text-zinc-100"
                value={financialNotes}
                onChange={(e) => setFinancialNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-800 flex justify-between items-center">
          <Button type="button" variant="ghost" className="text-zinc-400 hover:text-zinc-200" onClick={onClose}>
            Fechar
          </Button>

          {purchaseOrder.status === 'PENDING_FINANCIAL_APPROVAL' && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleFinancialDecision(false)}
                disabled={submitting}
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Recusar
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold size-sm"
                onClick={() => handleFinancialDecision(true)}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                Autorizar Pagamento (Financeiro)
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
