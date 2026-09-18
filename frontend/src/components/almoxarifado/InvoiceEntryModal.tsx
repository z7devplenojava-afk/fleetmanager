import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building2,
  Package,
  Truck,
  Loader2,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  procurementService,
  InvoiceEntryPayload,
  ProcurementPurchaseOrder
} from '@/services/procurementService';
import { MaterialRequisition } from '@/services/materialRequisitionService';

interface InvoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder?: ProcurementPurchaseOrder | null;
  requisition?: MaterialRequisition | null;
  onSuccess?: () => void;
}

export const InvoiceEntryModal: React.FC<InvoiceEntryModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  requisition,
  onSuccess
}) => {
  const { toast } = useToast();
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceSeries, setInvoiceSeries] = useState<string>('1');
  const [invoiceKey, setInvoiceKey] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierCnpj, setSupplierCnpj] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantityReceived, setQuantityReceived] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [totalInvoiceCost, setTotalInvoiceCost] = useState<number>(0);
  const [releaseToWorkOrder, setReleaseToWorkOrder] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (purchaseOrder) {
      setSupplierName(purchaseOrder.supplierName || '');
      setSupplierCnpj(purchaseOrder.supplierCnpj || '');
      setQuantityReceived(purchaseOrder.quantity || 1);
      setUnitCost(purchaseOrder.unitPrice || 0);
      setTotalInvoiceCost(purchaseOrder.totalAmount || 0);
    } else if (requisition) {
      setQuantityReceived(requisition.quantity || 1);
    }
  }, [purchaseOrder, requisition]);

  const handleUnitCostChange = (cost: number) => {
    setUnitCost(cost);
    setTotalInvoiceCost(cost * quantityReceived);
  };

  const handleQuantityChange = (qty: number) => {
    setQuantityReceived(qty);
    setTotalInvoiceCost(unitCost * qty);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      toast({
        title: 'Número da Nota Fiscal Obrigatório',
        description: 'Informe o número da NF-e de entrada.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: InvoiceEntryPayload = {
        purchaseOrderId: purchaseOrder?.id,
        requisitionId: requisition?.id || purchaseOrder?.requisitionId,
        stockItemId: requisition?.stockItemId,
        invoiceNumber,
        invoiceSeries,
        invoiceKey,
        supplierName,
        supplierCnpj,
        issueDate,
        quantityReceived,
        unitCost,
        totalInvoiceCost,
        entryType: purchaseOrder ? 'PURCHASE_ORDER' : 'MANUAL_ENTRY',
        releaseToWorkOrder,
        notes
      };

      const result = await procurementService.registerInvoiceEntry(payload);

      toast({
        title: 'Nota Fiscal de Entrada Registrada!',
        description: `Item liberado no almoxarifado. Lead Time / SLA registrado: ${
          result.formattedLeadTime || 'calculado com sucesso'
        }.`
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar entrada de NF',
        description: error?.response?.data?.message || 'Falha ao salvar nota fiscal de entrada.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cálculo de SLA em tempo real
  const createdAtStr = requisition?.createdAt || purchaseOrder?.createdAt;
  let elapsedMinutes = 0;
  if (createdAtStr) {
    elapsedMinutes = Math.floor((new Date().getTime() - new Date(createdAtStr).getTime()) / (1000 * 60));
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedRemMins = elapsedMinutes % 60;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <Receipt className="w-5 h-5 text-emerald-500" />
            Lançamento de Nota Fiscal de Entrada no Almoxarifado
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {purchaseOrder && (
              <>
                Ordem de Compra: <span className="font-semibold text-zinc-200">{purchaseOrder.ocNumber}</span> |{' '}
              </>
            )}
            Item:{' '}
            <span className="font-semibold text-emerald-300">
              {purchaseOrder?.itemName || requisition?.itemName || 'Item Avulso'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Card Indicador de SLA / Lead Time */}
          {createdAtStr && (
            <div className="p-3 bg-zinc-800/80 border border-zinc-700/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Tempo Decorrido desde a Requisição (SLA)</span>
                  <p className="text-sm font-bold text-zinc-100">
                    {elapsedHours > 0 ? `${elapsedHours}h ${elapsedRemMins}min` : `${elapsedMinutes} minutos`}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600/30 border border-emerald-500 text-emerald-300 text-xs px-2.5 py-1">
                <Zap className="w-3.5 h-3.5 mr-1" /> Registro Automático de SLA
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-zinc-300 font-medium">Número da NF-e *</Label>
              <Input
                required
                placeholder="Ex: 001429"
                className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-300 font-medium">Série</Label>
              <Input
                placeholder="1"
                className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                value={invoiceSeries}
                onChange={(e) => setInvoiceSeries(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-300 font-medium">Data de Emissão</Label>
              <Input
                type="date"
                className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100 text-xs"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-medium">Chave de Acesso da NF-e (44 dígitos)</Label>
            <Input
              placeholder="35260100000000000000550010000014291000014290"
              className="mt-1 bg-zinc-800 border-zinc-700 text-xs text-zinc-100 font-mono"
              value={invoiceKey}
              onChange={(e) => setInvoiceKey(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-300 font-medium">Fornecedor *</Label>
              <Input
                required
                placeholder="Nome da Empresa / Fornecedor"
                className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-300 font-medium">CNPJ do Fornecedor</Label>
              <Input
                placeholder="00.000.000/0000-00"
                className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100"
                value={supplierCnpj}
                onChange={(e) => setSupplierCnpj(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-800/40 border border-zinc-700/40 rounded-lg">
            <div>
              <Label className="text-xs text-zinc-300 font-medium">Qtd Recebida *</Label>
              <Input
                type="number"
                min="1"
                required
                className="mt-1 bg-zinc-900 border-zinc-700 text-zinc-100 font-bold"
                value={quantityReceived}
                onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-300 font-medium">Custo Unitário (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                className="mt-1 bg-zinc-900 border-zinc-700 text-zinc-100 font-semibold text-emerald-400"
                value={unitCost || ''}
                onChange={(e) => handleUnitCostChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-300 font-medium">Custo Total da NF</Label>
              <Input
                disabled
                className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-200 font-bold"
                value={`R$ ${(totalInvoiceCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-lg flex items-center gap-3">
            <input
              type="checkbox"
              id="releaseToWo"
              className="w-4 h-4 rounded text-emerald-600 bg-zinc-800 border-zinc-700 focus:ring-emerald-500"
              checked={releaseToWorkOrder}
              onChange={(e) => setReleaseToWorkOrder(e.target.checked)}
            />
            <label htmlFor="releaseToWo" className="text-xs text-zinc-200 cursor-pointer">
              <strong>Liberar Peça Imediatamente para a OS:</strong> Atualiza a reserva para{' '}
              <span className="text-emerald-300">Pronta para Instalação</span> e muda status da OS para{' '}
              <span className="text-emerald-300">Em Andamento</span>.
            </label>
          </div>

          <div>
            <Label className="text-xs text-zinc-400">Observações de Recebimento</Label>
            <Textarea
              rows={2}
              placeholder="Ex: Peça conferida fisicamente no almoxarifado, sem avarias..."
              className="mt-1 bg-zinc-800 border-zinc-700 text-xs text-zinc-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2 border-t border-zinc-800 flex justify-between">
            <Button type="button" variant="ghost" className="text-zinc-400 hover:text-zinc-200" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirmar Entrada e Liberar Peça
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
