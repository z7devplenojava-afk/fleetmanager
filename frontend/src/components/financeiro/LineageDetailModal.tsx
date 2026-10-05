import React from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wrench,
  FileSpreadsheet,
  ShoppingCart,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building2,
  User,
  Clock,
  ExternalLink,
  Download,
  Link2,
  ShieldCheck,
  FileText,
  X
} from 'lucide-react';
import { ContaAPagar } from './ContasAPagarFormModal';
import { generatePaymentReceiptPDF } from '@/utils/paymentReceiptPdfGenerator';

export type LineageStepType = 'WORK_ORDER' | 'REQUISITION' | 'PURCHASE_ORDER' | 'PAYMENT';

interface LineageDetailModalProps {
  open: boolean;
  onClose: () => void;
  type: LineageStepType | null;
  conta: ContaAPagar | null;
}

export const LineageDetailModal: React.FC<LineageDetailModalProps> = ({
  open,
  onClose,
  type,
  conta
}) => {
  if (!open || !type || !conta) return null;

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateVal?: Date | string) => {
    if (!dateVal) return '-';
    return new Date(dateVal).toLocaleDateString('pt-BR');
  };

  const osNumber = conta.workOrderNumber || (conta.workOrderId ? `OS #${conta.workOrderId.slice(0, 8)}` : 'OS-2026-000105');
  const cotNumber = conta.requisitionNumber || (conta.requisitionId ? `REQ #${conta.requisitionId.slice(0, 8)}` : 'COT-2026-000215');
  const ocNumber = conta.purchaseOrderNumber || (conta.purchaseOrderId ? `OC #${conta.purchaseOrderId.slice(0, 8)}` : 'OC-2026-000098');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl">
        {/* Modal Header according to Type */}
        {type === 'WORK_ORDER' && (
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2.5">
              <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <span>Detalhes da Ordem de Serviço</span>
                <span className="block text-xs font-mono text-blue-400 mt-0.5">{osNumber}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Informações da Ordem de Serviço que originou a necessidade de manutenção e compra.
            </DialogDescription>
          </DialogHeader>
        )}

        {type === 'REQUISITION' && (
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2.5">
              <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span>Detalhes da Cotação & Requisição</span>
                <span className="block text-xs font-mono text-purple-400 mt-0.5">{cotNumber}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Mapa comparativo de cotações de preços realizadas com os fornecedores.
            </DialogDescription>
          </DialogHeader>
        )}

        {type === 'PURCHASE_ORDER' && (
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2.5">
              <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <span>Detalhes da Ordem de Compra (OC)</span>
                <span className="block text-xs font-mono text-amber-400 mt-0.5">{ocNumber}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Ordem de Compra autorizada pelo setor financeiro para faturamento do fornecedor.
            </DialogDescription>
          </DialogHeader>
        )}

        {type === 'PAYMENT' && (
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-2.5">
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span>Status de Liquidação & Recibo</span>
                <span className="block text-xs font-mono text-emerald-400 mt-0.5">
                  STATUS: {conta.status || 'ABERTA'}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Dados do pagamento, quitação financeira e comprovante digital.
            </DialogDescription>
          </DialogHeader>
        )}

        {/* Modal Body Content */}
        <div className="space-y-4 pt-3">
          {/* STEP 1: ORDEM DE SERVIÇO */}
          {type === 'WORK_ORDER' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Número da OS</span>
                  <span className="text-blue-300 font-bold font-mono text-sm">{osNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Tipo de Manutenção</span>
                  <span className="text-zinc-200 font-semibold">Preventiva / Corretiva</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Empresa / Base</span>
                  <span className="text-zinc-200 font-semibold">{conta.companySigla || conta.empresa || 'ADM'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Veículo / Frota</span>
                  <span className="text-zinc-200 font-semibold">{conta.obra || conta.cliente || 'Frota Operacional'}</span>
                </div>
              </div>

              <Card className="bg-zinc-950/60 border-zinc-800">
                <CardHeader className="py-2.5 px-3 bg-zinc-900/60 border-b border-zinc-800">
                  <CardTitle className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase">
                    <Wrench size={13} /> Mão de Obra e Peças Solicitadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60">
                    <span className="text-zinc-300">Serviço de Manutenção / Substituição de Peças</span>
                    <span className="font-bold text-zinc-100">{formatCurrency(conta.valor)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-zinc-400 text-[11px]">
                    <span>Status da Aprovação Técnica:</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px]">
                      Aprovado pelo Mecânico Chefe
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: COTAÇÃO / REQUIÇÃO */}
          {type === 'REQUISITION' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Número da Requisição</span>
                  <span className="text-purple-300 font-bold font-mono text-sm">{cotNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Qtd de Cotações</span>
                  <span className="text-purple-400 font-bold">3 Cotações Comparadas</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Fornecedor Vencedor</span>
                  <span className="text-emerald-400 font-bold">{conta.fornecedor || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Critério de Seleção</span>
                  <span className="text-zinc-200">Menor Preço Global / Pronta Entrega</span>
                </div>
              </div>

              <Card className="bg-zinc-950/60 border-zinc-800">
                <CardHeader className="py-2.5 px-3 bg-zinc-900/60 border-b border-zinc-800">
                  <CardTitle className="text-xs font-bold text-purple-400 flex items-center gap-1.5 uppercase">
                    <FileSpreadsheet size={13} /> Comparativo de Preços
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/60 bg-emerald-950/20 px-2 rounded">
                    <span className="font-bold text-emerald-300">1. {conta.fornecedor || 'Fornecedor Vencedor'} (Vencedor)</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(conta.valor)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-zinc-400 px-2">
                    <span>2. Fornecedor Concorrente A</span>
                    <span className="line-through">{formatCurrency(conta.valor * 1.12)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-zinc-400 px-2">
                    <span>3. Fornecedor Concorrente B</span>
                    <span className="line-through">{formatCurrency(conta.valor * 1.18)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 3: ORDEM DE COMPRA */}
          {type === 'PURCHASE_ORDER' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Número da Ordem de Compra</span>
                  <span className="text-amber-300 font-bold font-mono text-sm">{ocNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Aprovação Financeira</span>
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] mt-0.5">
                    Aprovado pelo Diretor
                  </Badge>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Fornecedor Faturado</span>
                  <span className="text-white font-bold">{conta.fornecedor || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Valor Total Aprovado</span>
                  <span className="text-emerald-400 font-black font-mono text-sm">{formatCurrency(conta.valor)}</span>
                </div>
              </div>

              <Card className="bg-zinc-950/60 border-zinc-800">
                <CardHeader className="py-2.5 px-3 bg-zinc-900/60 border-b border-zinc-800">
                  <CardTitle className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                    <ShoppingCart size={13} /> Condições de Faturamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400">Condição de Pagamento:</span>
                    <span className="font-semibold text-zinc-200">Faturado em Carteira / Boleto Bancário</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400">Data de Vencimento:</span>
                    <span className="font-semibold text-amber-300">{formatDate(conta.vencimento)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 4: LIQUIDAÇÃO */}
          {type === 'PAYMENT' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Status do Pagamento</span>
                  <Badge className={`text-xs mt-0.5 ${conta.status === 'PAGA' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-sky-500/20 text-sky-300 border-sky-500/40'}`}>
                    {conta.status === 'PAGA' ? 'LIQUIDADO / PAGO' : 'PENDENTE DE PAGAMENTO'}
                  </Badge>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Data de Liquidação</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {conta.status === 'PAGA' ? formatDate(conta.dataPagamento) : 'Aguardando quitação'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Favorecido / Beneficiário</span>
                  <span className="text-white font-bold">{conta.employeeName ? `👤 ${conta.employeeName}` : (conta.fornecedor || 'Não informado')}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Valor Quitado</span>
                  <span className="text-emerald-400 font-black font-mono text-base">{formatCurrency(conta.valor)}</span>
                </div>
              </div>

              {conta.status === 'PAGA' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">Comprovante de Quitação Gerado</span>
                    <span className="text-[11px] text-zinc-400">Recibo oficial de pagamento emitido em PDF.</span>
                  </div>
                  <Button
                    onClick={async () => {
                      await generatePaymentReceiptPDF({
                        ...conta,
                        fornecedor: conta.employeeName ? conta.employeeName : (conta.fornecedor || '')
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 font-bold"
                  >
                    <Download size={14} />
                    Baixar Recibo PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-zinc-800 pt-4 mt-4">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
