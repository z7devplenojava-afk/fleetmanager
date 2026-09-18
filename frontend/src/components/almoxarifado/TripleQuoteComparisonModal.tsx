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
  CheckCircle2,
  TrendingDown,
  Clock,
  CreditCard,
  Building2,
  ShieldCheck,
  Loader2,
  Sparkles,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  procurementService,
  ProcurementQuoteComparison,
  ProcurementQuoteOption,
  SaveTripleQuotesPayload,
  ApproveQuotePayload
} from '@/services/procurementService';
import { MaterialRequisition } from '@/services/materialRequisitionService';

interface TripleQuoteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: MaterialRequisition;
  onApproved?: () => void;
}

export const TripleQuoteComparisonModal: React.FC<TripleQuoteComparisonModalProps> = ({
  isOpen,
  onClose,
  requisition,
  onApproved
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [comparison, setComparison] = useState<ProcurementQuoteComparison | null>(null);

  // Form for 3 Quotes
  const [quotes, setQuotes] = useState<ProcurementQuoteOption[]>([
    {
      supplierName: '',
      supplierCnpj: '',
      supplierContact: '',
      supplierPhone: '',
      unitPrice: 0,
      totalPrice: 0,
      paymentTerms: '30 DIAS',
      paymentTermDays: 30,
      deliveryTimeDays: 2,
      warrantyMonths: 3
    },
    {
      supplierName: '',
      supplierCnpj: '',
      supplierContact: '',
      supplierPhone: '',
      unitPrice: 0,
      totalPrice: 0,
      paymentTerms: '30/60 DIAS',
      paymentTermDays: 60,
      deliveryTimeDays: 3,
      warrantyMonths: 6
    },
    {
      supplierName: '',
      supplierCnpj: '',
      supplierContact: '',
      supplierPhone: '',
      unitPrice: 0,
      totalPrice: 0,
      paymentTerms: '30/60/90 DIAS',
      paymentTermDays: 90,
      deliveryTimeDays: 5,
      warrantyMonths: 12
    }
  ]);

  // Approval State
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [approverNotes, setApproverNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && requisition?.id) {
      loadComparison();
    }
  }, [isOpen, requisition?.id]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const data = await procurementService.getQuotesByRequisition(requisition.id);
      if (data && data.options && data.options.length >= 3) {
        setComparison(data);
        setQuotes(data.options);
        if (data.chosenOptionId) {
          setSelectedWinnerId(data.chosenOptionId);
        } else if (data.systemRecommendedOptionId) {
          setSelectedWinnerId(data.systemRecommendedOptionId);
        }
      } else {
        setComparison(null);
      }
    } catch (error) {
      console.error('Erro ao carregar comparação de cotações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteChange = (index: number, field: keyof ProcurementQuoteOption, value: any) => {
    const updated = [...quotes];
    (updated[index] as any)[field] = value;

    if (field === 'unitPrice') {
      const qty = requisition.quantity || 1;
      updated[index].totalPrice = Number(value) * qty;
    }

    if (field === 'paymentTerms') {
      const valStr = String(value).toUpperCase();
      if (valStr.includes('90')) updated[index].paymentTermDays = 90;
      else if (valStr.includes('60')) updated[index].paymentTermDays = 60;
      else if (valStr.includes('30')) updated[index].paymentTermDays = 30;
      else updated[index].paymentTermDays = 0;
    }

    setQuotes(updated);
  };

  const handleSaveQuotes = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < 3; i++) {
      if (!quotes[i].supplierName || quotes[i].unitPrice <= 0) {
        toast({
          title: 'Dados Incompletos',
          description: `Preencha o fornecedor e o valor unitário da Cotação ${i + 1}.`,
          variant: 'destructive'
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: SaveTripleQuotesPayload = {
        requisitionId: requisition.id,
        options: quotes
      };

      const result = await procurementService.saveTripleQuotes(payload);
      setComparison(result);
      if (result.systemRecommendedOptionId) {
        setSelectedWinnerId(result.systemRecommendedOptionId);
      }
      toast({
        title: '3 Cotações Salvas e Avaliadas!',
        description: 'O algoritmo analisou preço, condições de pagamento e prazos de entrega.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar cotações',
        description: error?.response?.data?.message || 'Falha ao salvar as cotações.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!comparison || !selectedWinnerId) return;

    const isOverriding = selectedWinnerId !== comparison.systemRecommendedOptionId;
    if (isOverriding && !overrideReason.trim()) {
      toast({
        title: 'Justificativa de Sobrescrita Obrigatória',
        description: 'Você selecionou uma cotação diferente da sugerida pelo sistema. Informe a justificativa.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: ApproveQuotePayload = {
        comparisonId: comparison.id,
        chosenOptionId: selectedWinnerId,
        overrideReason: isOverriding ? overrideReason : undefined,
        approverNotes
      };

      await procurementService.approveQuote(payload);

      toast({
        title: 'Cotação Aprovada!',
        description: 'Ordem de Compra (OC) gerada e encaminhada ao Financeiro com sucesso.'
      });

      if (onApproved) {
        onApproved();
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar cotação',
        description: error?.response?.data?.message || 'Falha ao aprovar cotação.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Módulo de 3 Cotações Obrigatórias & Análise Inteligente
          </DialogTitle>
          <DialogDescription>
            <span className="text-zinc-400">Avalie as 3 propostas para definir o melhor custo-benefício e condições de fornecimento.</span>
          </DialogDescription>
        </DialogHeader>

        {/* Card Detalhado de Contexto da Requisição (O que, Por que, Por quem e Para onde) */}
        {requisition && (
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 shadow-inner space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {requisition.requisitionNumber}
                </span>
                <span className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  📦 {requisition.quantity} {requisition.unit || 'un'} × {requisition.itemName}
                </span>
                {requisition.itemCode && (
                  <span className="text-xs text-zinc-400 font-mono">(Cód: {requisition.itemCode})</span>
                )}
              </div>
              <Badge
                variant="outline"
                className={
                  requisition.urgency === 'EMERGENCIA'
                    ? 'border-red-500 text-red-400 bg-red-950/40 font-bold'
                    : 'border-zinc-700 text-zinc-300 bg-zinc-800/60'
                }
              >
                {requisition.urgency === 'EMERGENCIA' ? '🚨 EMERGÊNCIA' : '🟢 NORMAL'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block font-medium">🔧 Ordem de Serviço & Veículo</span>
                <span className="text-zinc-200 font-semibold mt-0.5 block">
                  {requisition.workOrderNumber ? `OS: ${requisition.workOrderNumber}` : 'Sem OS direta'}
                </span>
                {requisition.vehiclePlate && (
                  <span className="text-amber-400/90 font-mono text-[11px] block">
                    🚗 {requisition.vehiclePlate} {requisition.vehicleModel ? `(${requisition.vehicleModel})` : ''}
                  </span>
                )}
              </div>

              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block font-medium">👤 Solicitado Por (Quem)</span>
                <span className="text-zinc-200 font-semibold mt-0.5 block">
                  {requisition.requesterName || 'Mecânico / Solicitante da Manutenção'}
                </span>
                <span className="text-zinc-400 text-[11px] block">
                  Data: {requisition.createdAt ? new Date(requisition.createdAt).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>

              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 block font-medium">📝 Motivo / Justificativa (Por quê)</span>
                <p className="text-zinc-300 mt-0.5 line-clamp-2 italic" title={requisition.justification}>
                  "{requisition.justification || 'Solicitação de compra de peça para reposição na OS.'}"
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* 3 Colunas de Cotação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quotes.map((quote, idx) => {
                const isSysRec = comparison?.systemRecommendedOptionId === quote.id;
                const isSelected = selectedWinnerId === quote.id;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-500/10'
                        : isSysRec
                        ? 'bg-emerald-950/20 border-emerald-500/60'
                        : 'bg-zinc-800/60 border-zinc-700/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Cotação #{idx + 1}
                      </span>
                      {isSysRec && (
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Recomendado
                        </Badge>
                      )}
                      {isSelected && !isSysRec && (
                        <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                          Selecionado
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-[11px] text-zinc-400">Fornecedor *</Label>
                        <Input
                          placeholder="Nome da Auto Peças / Fornecedor"
                          className="mt-1 bg-zinc-900 border-zinc-700 text-sm text-zinc-100"
                          value={quote.supplierName}
                          onChange={(e) => handleQuoteChange(idx, 'supplierName', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px] text-zinc-400">Preço Unitário (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            className="mt-1 bg-zinc-900 border-zinc-700 text-sm font-semibold text-emerald-400"
                            value={quote.unitPrice || ''}
                            onChange={(e) => handleQuoteChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-zinc-400">Total (R$)</Label>
                          <Input
                            disabled
                            className="mt-1 bg-zinc-950 border-zinc-800 text-sm font-bold text-zinc-200"
                            value={`R$ ${(quote.totalPrice || 0).toFixed(2)}`}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] text-zinc-400">Condições de Pagamento *</Label>
                        <select
                          className="w-full mt-1 p-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:ring-2 focus:ring-amber-500"
                          value={quote.paymentTerms}
                          onChange={(e) => handleQuoteChange(idx, 'paymentTerms', e.target.value)}
                        >
                          <option value="À VISTA">À Vista</option>
                          <option value="15 DIAS">Boleto 15 Dias</option>
                          <option value="30 DIAS">Boleto 30 Dias</option>
                          <option value="30/60 DIAS">Boleto 30/60 Dias (Faturado)</option>
                          <option value="30/60/90 DIAS">Boleto 30/60/90 Dias (3x)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[11px] text-zinc-400">Prazo de Entrega (dias)</Label>
                          <Input
                            type="number"
                            min="0"
                            className="mt-1 bg-zinc-900 border-zinc-700 text-xs text-zinc-100"
                            value={quote.deliveryTimeDays}
                            onChange={(e) =>
                              handleQuoteChange(idx, 'deliveryTimeDays', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] text-zinc-400">Garantia (Meses)</Label>
                          <Input
                            type="number"
                            min="0"
                            className="mt-1 bg-zinc-900 border-zinc-700 text-xs text-zinc-100"
                            value={quote.warrantyMonths}
                            onChange={(e) =>
                              handleQuoteChange(idx, 'warrantyMonths', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      {comparison && quote.id && (
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className={`w-full text-xs font-semibold ${
                              isSelected
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                            }`}
                            onClick={() => setSelectedWinnerId(quote.id!)}
                          >
                            {isSelected ? '✓ Cotação Escolhida' : 'Escolher esta Cotação'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AVALIAÇÃO INTELIGENTE DO SISTEMA */}
            {comparison && (
              <div className="p-4 bg-zinc-800/80 border border-zinc-700 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">
                      Parecer e Análise Inteligente do Sistema
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {comparison.systemRecommendationReason ||
                        'O sistema analisou o menor preço e ponderou prazos de pagamento estendidos (30/60/90 dias) e tempo de entrega.'}
                    </p>
                  </div>
                </div>

                {/* Sobrescrita de Cotação */}
                {selectedWinnerId &&
                  selectedWinnerId !== comparison.systemRecommendedOptionId && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4" />
                        Atenção: Sobrescrita da Sugestão do Sistema
                      </div>
                      <Label className="text-xs text-zinc-300">
                        Justificativa do Gestor de Manutenção para escolher outra cotação *
                      </Label>
                      <Textarea
                        rows={2}
                        required
                        placeholder="Ex: Fornecedor possui pronta entrega imediata essencial para veículo na rota ou possui maior confiabilidade técnica..."
                        className="bg-zinc-900 border-zinc-700 text-xs text-zinc-100"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                      />
                    </div>
                  )}
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-zinc-800 flex justify-between items-center">
              <Button type="button" variant="ghost" className="text-zinc-400 hover:text-zinc-200" onClick={onClose}>
                Cancelar
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                  onClick={handleSaveQuotes}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileCheck className="w-4 h-4 mr-2" />}
                  Salvar / Reavaliar 3 Cotações
                </Button>

                {comparison && (
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                    onClick={handleApprove}
                    disabled={submitting || !selectedWinnerId}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                    Aprovar e Gerar Ordem de Compra (OC)
                  </Button>
                )}
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
