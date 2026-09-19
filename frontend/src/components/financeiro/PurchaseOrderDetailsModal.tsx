import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CreditCard,
  Building2,
  Calendar,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  X,
  FileCheck2,
  Tag,
  Hash,
  Phone,
  DollarSign
} from 'lucide-react';
import { ProcurementPurchaseOrder } from '@/services/procurementService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchaseOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: ProcurementPurchaseOrder | null;
  onOpenProgramming?: (po: ProcurementPurchaseOrder) => void;
}

export const PurchaseOrderDetailsModal: React.FC<PurchaseOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onOpenProgramming
}) => {
  if (!purchaseOrder) return null;

  const po = purchaseOrder;

  const formatBRL = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informada';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_FINANCIAL_APPROVAL':
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40">Pendente Financeiro</Badge>;
      case 'FINANCIAL_APPROVED':
        return <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40">Programado / Aprovado</Badge>;
      case 'PURCHASED_IN_TRANSIT':
        return <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40">Em Trânsito</Badge>;
      case 'DELIVERED_IN_ALMOXARIFADO':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Entregue no Almoxarifado</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500/20 text-red-300 border border-red-500/40">Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400 border-gray-700">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full bg-[#0d0e12] border-gray-800 text-gray-100 shadow-2xl p-0 overflow-hidden rounded-2xl z-[10150]">
        {/* Header Decorativo */}
        <div className="bg-gradient-to-r from-blue-900/30 via-zinc-900 to-zinc-900 p-5 border-b border-gray-800/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 shadow-inner">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-bold text-white">
                  Ordem de Compra {po.ocNumber}
                </DialogTitle>
                {getStatusBadge(po.status)}
              </div>
              <DialogDescription className="text-xs text-gray-400 mt-0.5">
                Emitida em {formatDate(po.createdAt)} • Requisição: {po.requisitionNumber || '—'}
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800/60 h-8 w-8 p-0 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo Detalhado */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card Resumo do Valor */}
          <div className="p-4 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-gray-800 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider block">Valor Total da Ordem</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatBRL(po.totalAmount)}
              </span>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[11px] text-gray-400 block">Condição de Pagamento</span>
              <Badge variant="outline" className="bg-zinc-800 border-gray-700 text-gray-200 font-semibold text-xs">
                {po.paymentTerms || 'À VISTA'}
              </Badge>
            </div>
          </div>

          {/* Dados do Fornecedor e Peça */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fornecedor */}
            <div className="p-3.5 bg-zinc-950/70 border border-gray-800/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wide">
                <Building2 className="h-4 w-4" /> Fornecedor Vencedor
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-white text-sm truncate" title={po.supplierName}>
                  {po.supplierName}
                </p>
                {po.supplierCnpj && (
                  <p className="text-gray-400 font-mono text-[11px]">
                    CNPJ: {po.supplierCnpj}
                  </p>
                )}
                {po.supplierContact && (
                  <p className="text-gray-300 text-[11px]">
                    Contato: {po.supplierContact}
                  </p>
                )}
                {po.supplierPhone && (
                  <p className="text-gray-400 text-[11px] flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-500" /> {po.supplierPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Peça / Material */}
            <div className="p-3.5 bg-zinc-950/70 border border-gray-800/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Package className="h-4 w-4" /> Peça / Insumo
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-white text-sm truncate" title={po.itemName}>
                  {po.itemName}
                </p>
                {po.itemCode && (
                  <p className="text-amber-400 font-mono text-[11px]">
                    Código: [{po.itemCode}]
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Quantidade: <strong className="text-white">{po.quantity}</strong></span>
                  <span>Unitário: <strong className="text-white">{formatBRL(po.unitPrice)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Vínculo Operacional (Veículo & OS) */}
          <div className="p-3.5 bg-zinc-950/70 border border-gray-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wide">
              <Truck className="h-4 w-4 text-emerald-400" /> Destino & Vínculo Operacional
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-[11px] text-gray-400 block">Veículo / Placa</span>
                <span className="font-bold text-white font-mono">
                  {po.vehiclePlate ? `🚚 ${po.vehiclePlate}` : 'Estoque Geral'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Ordem de Serviço (O.S.)</span>
                <span className="font-bold text-white font-mono">
                  {po.workOrderNumber ? `🔧 ${po.workOrderNumber}` : 'Avulsa / Almoxarifado'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 block">Grau de Urgência</span>
                <span className={`font-bold ${po.urgency === 'EMERGENCIA' ? 'text-red-400' : 'text-gray-300'}`}>
                  {po.urgency || 'NORMAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Programação Financeira & Cartão Corporativo */}
          <div className="p-3.5 bg-blue-950/20 border border-blue-800/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wide">
                <CreditCard className="h-4 w-4 text-blue-400" /> Programação Financeira
              </div>
              {po.paymentStatus && (
                <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-300">
                  {po.paymentStatus}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-gray-400 block">Forma de Pagamento</span>
                <span className="font-bold text-white">
                  {po.paymentMethod ? po.paymentMethod.replace('_', ' ') : 'Aguardando Programação'}
                </span>
                {po.installmentsCount && po.installmentsCount > 1 && (
                  <span className="text-[11px] text-blue-300 block">
                    Parcelado em {po.installmentsCount}x de {formatBRL(po.totalAmount / po.installmentsCount)}
                  </span>
                )}
              </div>

              {po.cardNumber && (
                <div>
                  <span className="text-[11px] text-gray-400 block">Cartão Corporativo</span>
                  <span className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                    💳 {po.cardNumber}
                    {po.cardFlag && <Badge variant="outline" className="text-[10px] ml-1">{po.cardFlag}</Badge>}
                  </span>
                </div>
              )}

              {po.paymentReference && (
                <div>
                  <span className="text-[11px] text-gray-400 block">Chave / Referência PIX ou Boleto</span>
                  <span className="font-mono text-gray-300 text-[11px] break-all">
                    {po.paymentReference}
                  </span>
                </div>
              )}

              {po.paymentScheduledDate && (
                <div>
                  <span className="text-[11px] text-gray-400 block">Data Programada</span>
                  <span className="font-semibold text-gray-200">
                    {formatDate(po.paymentScheduledDate)}
                  </span>
                </div>
              )}
            </div>

            {po.financialNotes && (
              <div className="p-2.5 bg-black/40 border border-gray-800 rounded-lg text-xs">
                <span className="text-[11px] text-gray-400 font-medium block">Notas do Financeiro:</span>
                <p className="text-gray-300 italic">{po.financialNotes}</p>
              </div>
            )}
          </div>

          {/* Dados Fiscais e Recebimento (se houver) */}
          {(po.invoiceNumber || po.invoiceKey) && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-400 uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4" /> Nota Fiscal de Entrada
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-gray-400 block">Número da NF-e</span>
                  <span className="font-bold text-white font-mono">{po.invoiceNumber}</span>
                </div>
                {po.invoiceReceivedAt && (
                  <div>
                    <span className="text-[11px] text-gray-400 block">Recebido no Almoxarifado em</span>
                    <span className="text-gray-300">{formatDate(po.invoiceReceivedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-zinc-950 border-t border-gray-800 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs px-4"
          >
            Fechar
          </Button>

          {onOpenProgramming && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onOpenProgramming(po);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 px-4 shadow-lg shadow-blue-600/20"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {po.status === 'PENDING_FINANCIAL_APPROVAL' || !po.paymentMethod
                ? 'Programar Pagamento'
                : 'Ajustar Programação'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
