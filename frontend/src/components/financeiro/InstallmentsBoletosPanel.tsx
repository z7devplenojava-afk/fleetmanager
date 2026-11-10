import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import contasAPagarService from '@/services/contasAPagarService';
import BoletoViewerModal from '@/components/abastecimento/BoletoViewerModal';
import {
  InstallmentBoletoItem,
  attachSingleBoletoToInstallment,
  matchBoletosBatchToInstallments,
  formatDateBR,
  toIsoDateOnly,
} from '@/utils/boletoInstallmentMatcher';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  Loader2,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Barcode,
  Layers,
} from 'lucide-react';

interface InstallmentsBoletosPanelProps {
  installments: InstallmentBoletoItem[];
  onChange: (next: InstallmentBoletoItem[]) => void;
  totalExpected?: number;
  onSyncTotal?: (newTotal: number) => void;
  supplierName?: string;
  invoiceNumber?: string;
  allowAddSplit?: boolean;
  title?: string;
  subtitle?: string;
}

export const InstallmentsBoletosPanel: React.FC<InstallmentsBoletosPanelProps> = ({
  installments,
  onChange,
  totalExpected,
  onSyncTotal,
  supplierName,
  invoiceNumber,
  allowAddSplit = true,
  title = 'Parcelas & Boletos Bancários',
  subtitle = 'Faça upload de cada boleto individualmente ou selecione todos de uma vez (em lote) para identificar vencimentos e valores automaticamente.',
}) => {
  const { toast } = useToast();
  const batchInputRef = useRef<HTMLInputElement>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingSeq, setLoadingSeq] = useState<number | null>(null);
  const [copiedSeq, setCopiedSeq] = useState<number | null>(null);
  const [viewerData, setViewerData] = useState<{
    isOpen: boolean;
    item?: InstallmentBoletoItem;
  }>({ isOpen: false });

  const sumInstallments = installments.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const hasSumDiff =
    totalExpected !== undefined &&
    totalExpected > 0 &&
    installments.length > 0 &&
    Math.abs(sumInstallments - totalExpected) > 0.05;

  const attachedCount = installments.filter((i) => Boolean(i.boletoUrl)).length;

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setLoadingBatch(true);
      const parsedBoletos = await contasAPagarService.parseBoletosBatch(Array.from(files));
      if (!parsedBoletos || parsedBoletos.length === 0) {
        toast({
          title: 'Nenhum boleto processado',
          description: 'Não foi possível ler os arquivos enviados.',
          variant: 'destructive',
        });
        return;
      }

      const result = matchBoletosBatchToInstallments(installments, parsedBoletos, {
        expandIfSingleOrEmpty: true,
      });

      onChange(result.installments);

      if (result.createdFromBatch && onSyncTotal) {
        const newSum = result.installments.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        if (newSum > 0) onSyncTotal(Math.round(newSum * 100) / 100);
      }

      const detectedWithValues = parsedBoletos.filter((b) => (b.amount || 0) > 0 || b.dueDate).length;
      toast({
        title: `${parsedBoletos.length} boleto(s) importado(s) em lote!`,
        description: result.createdFromBatch
          ? `${result.installments.length} parcela(s) gerada(s) em ordem de vencimento (${detectedWithValues} com dados extraídos).`
          : `${result.matchedCount} boleto(s) vinculado(s) às parcelas por valor e vencimento.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao importar boletos em lote',
        description: err?.response?.data?.message || err?.message || 'Verifique os arquivos PDF/imagem.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBatch(false);
      if (batchInputRef.current) batchInputRef.current.value = '';
    }
  };

  const handleSingleUpload = async (seq: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setLoadingSeq(seq);
      const parsed = await contasAPagarService.parseBoleto(file);
      const next = installments.map((inst) =>
        inst.installmentNumber === seq ? attachSingleBoletoToInstallment(inst, parsed, true) : inst
      );
      onChange(next);

      const detectedSummary = [
        parsed.amount && parsed.amount > 0
          ? `R$ ${Number(parsed.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : null,
        parsed.dueDate ? `Venc. ${formatDateBR(parsed.dueDate)}` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      toast({
        title: `Boleto anexado à Parcela ${seq}!`,
        description: detectedSummary
          ? `Dados identificados: ${detectedSummary}`
          : `Arquivo "${file.name}" vinculado.`,
      });
    } catch (err: any) {
      toast({
        title: `Falha ao ler boleto da Parcela ${seq}`,
        description: err?.response?.data?.message || err?.message || 'Não foi possível processar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSeq(null);
    }
  };

  const handleApplyBoletoValues = (seq: number) => {
    const next = installments.map((inst) => {
      if (inst.installmentNumber !== seq) return inst;
      return {
        ...inst,
        amount: inst.boletoAmount && inst.boletoAmount > 0 ? inst.boletoAmount : inst.amount,
        dueDate: inst.boletoDueDate || inst.dueDate,
        divergenceAlert: undefined,
      };
    });
    onChange(next);
    toast({
      title: 'Parcela atualizada',
      description: `Valor e vencimento da Parcela ${seq} sincronizados com o boleto.`,
    });
  };

  const handleRemoveBoleto = (seq: number) => {
    onChange(
      installments.map((inst) =>
        inst.installmentNumber === seq
          ? {
              ...inst,
              barcode: undefined,
              linhaDigitavel: undefined,
              boletoUrl: undefined,
              originalBoletoName: undefined,
              boletoAmount: undefined,
              boletoDueDate: undefined,
              bankName: undefined,
              divergenceAlert: undefined,
            }
          : inst
      )
    );
  };

  const handleFieldChange = (
    seq: number,
    field: 'dueDate' | 'amount' | 'linhaDigitavel',
    value: string | number
  ) => {
    onChange(
      installments.map((inst) => {
        if (inst.installmentNumber !== seq) return inst;
        const updated = { ...inst, [field]: value };
        if (field === 'linhaDigitavel') {
          updated.barcode = String(value);
        }
        return updated;
      })
    );
  };

  const handleAddInstallment = () => {
    const last = installments[installments.length - 1];
    const nextNum = installments.length + 1;
    let nextDate = toIsoDateOnly(new Date());
    if (last?.dueDate) {
      const parts = last.dueDate.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        d.setMonth(d.getMonth() + 1);
        nextDate = toIsoDateOnly(d);
      }
    }
    onChange([
      ...installments,
      {
        installmentNumber: nextNum,
        dueDate: nextDate,
        amount: 0,
      },
    ]);
  };

  const handleRemoveInstallment = (seq: number) => {
    if (installments.length <= 1) return;
    const filtered = installments
      .filter((i) => i.installmentNumber !== seq)
      .map((i, idx) => ({ ...i, installmentNumber: idx + 1 }));
    onChange(filtered);
  };

  const handleCopyCode = (seq: number, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedSeq(seq);
    toast({ title: 'Copiado', description: 'Linha digitável copiada para a área de transferência.' });
    setTimeout(() => setCopiedSeq(null), 2000);
  };

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/25 bg-zinc-950/60 p-3.5 sm:p-4">
      {/* Cabeçalho + Upload em Lote */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Barcode className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-zinc-100">{title}</span>
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
              {installments.length} parcela(s) • {attachedCount} boleto(s)
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={batchInputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleBatchUpload}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => batchInputRef.current?.click()}
            disabled={loadingBatch}
            className="h-8 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm"
          >
            {loadingBatch ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Lendo Boletos...
              </>
            ) : (
              <>
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Upload Boletos em Lote
              </>
            )}
          </Button>
          {allowAddSplit && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddInstallment}
              className="h-8 px-2.5 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Parcela
            </Button>
          )}
        </div>
      </div>

      {/* Resumo Financeiro das Parcelas */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-zinc-900/70 border border-zinc-800/80 rounded-lg px-3 py-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-zinc-400">
            Soma das parcelas:{' '}
            <strong className="text-emerald-400 font-mono">
              R$ {sumInstallments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </span>
          {totalExpected !== undefined && totalExpected > 0 && (
            <span className="text-zinc-500">
              • Total da NF/Conta:{' '}
              <strong className="text-zinc-200 font-mono">
                R$ {totalExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </span>
          )}
        </div>

        {hasSumDiff && onSyncTotal && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSyncTotal(Math.round(sumInstallments * 100) / 100)}
            className="h-7 px-2.5 text-[11px] border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar Total para Soma das Parcelas
          </Button>
        )}
      </div>

      {/* Lista de Parcelas com Upload Individual */}
      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {installments.map((inst) => {
          const fileInputId = `boleto-parcela-${inst.installmentNumber}-${invoiceNumber || 'conta'}`;
          const isUploadingThis = loadingSeq === inst.installmentNumber;
          const hasBoleto = Boolean(inst.boletoUrl);

          return (
            <div
              key={inst.installmentNumber}
              className={`rounded-lg border p-3 transition-colors space-y-2 ${
                inst.divergenceAlert
                  ? 'border-amber-500/60 bg-amber-950/20'
                  : hasBoleto
                  ? 'border-emerald-500/35 bg-emerald-950/15'
                  : 'border-zinc-800 bg-zinc-900/70'
              }`}
            >
              {/* Linha principal: Parcela | Vencimento | Valor | Botões de Boleto */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-2 flex items-center justify-between sm:block">
                  <span className="text-xs font-bold text-amber-400 font-mono block">
                    Parc. {inst.installmentNumber}/{installments.length}
                  </span>
                  {hasBoleto ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 shrink-0" /> Boleto ok
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Sem boleto</span>
                  )}
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400 block">
                    Vencimento
                  </label>
                  <Input
                    type="date"
                    value={toIsoDateOnly(inst.dueDate)}
                    onChange={(e) => handleFieldChange(inst.installmentNumber, 'dueDate', e.target.value)}
                    className="h-8 text-xs bg-zinc-950 border-zinc-700 text-zinc-100 font-mono"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400 block">
                    Valor (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inst.amount || ''}
                    onChange={(e) =>
                      handleFieldChange(
                        inst.installmentNumber,
                        'amount',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className="h-8 text-xs bg-zinc-950 border-zinc-700 text-emerald-400 font-bold font-mono text-right"
                  />
                </div>

                <div className="sm:col-span-4 flex items-center justify-end gap-1.5 flex-wrap">
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleSingleUpload(inst.installmentNumber, e)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUploadingThis}
                    onClick={() => document.getElementById(fileInputId)?.click()}
                    className={`h-8 px-2.5 text-xs ${
                      hasBoleto
                        ? 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                        : 'border-amber-500/50 text-amber-300 hover:bg-amber-500/15'
                    }`}
                  >
                    {isUploadingThis ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1" />
                    )}
                    {hasBoleto ? 'Trocar' : 'Anexar Boleto'}
                  </Button>

                  {hasBoleto && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setViewerData({ isOpen: true, item: inst })}
                        className="h-8 px-2 text-xs border-sky-500/50 text-sky-300 hover:bg-sky-500/15"
                        title="Visualizar / Imprimir Boleto"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveBoleto(inst.installmentNumber)}
                        className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Remover boleto anexado"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}

                  {allowAddSplit && installments.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveInstallment(inst.installmentNumber)}
                      className="h-8 px-2 text-xs text-zinc-500 hover:text-red-400"
                      title="Remover parcela"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>

              {/* Detalhes do Boleto Extraído / Linha Digitável */}
              {(hasBoleto || inst.linhaDigitavel || inst.barcode) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/70 text-[11px]">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    {inst.originalBoletoName && (
                      <span className="inline-flex items-center gap-1 text-zinc-200 font-medium truncate max-w-[200px]">
                        <FileText className="h-3 w-3 text-emerald-400 shrink-0" />
                        {inst.originalBoletoName}
                      </span>
                    )}
                    {inst.bankName && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] py-0">
                        {inst.bankName}
                      </Badge>
                    )}
                    {(inst.boletoAmount || inst.boletoDueDate) && (
                      <span className="text-zinc-400 font-mono text-[10px]">
                        Extraído:{' '}
                        {inst.boletoAmount
                          ? `R$ ${inst.boletoAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : ''}
                        {inst.boletoDueDate ? ` (${formatDateBR(inst.boletoDueDate)})` : ''}
                      </span>
                    )}
                  </div>

                  {(inst.linhaDigitavel || inst.barcode) && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] text-amber-300/90 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[240px]">
                        {inst.linhaDigitavel || inst.barcode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(inst.installmentNumber, inst.linhaDigitavel || inst.barcode)}
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                        title="Copiar linha digitável"
                      >
                        {copiedSeq === inst.installmentNumber ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Alerta de divergência + Sincronização 1-clique */}
              {inst.divergenceAlert && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-amber-500/15 border border-amber-500/40 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{inst.divergenceAlert}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApplyBoletoValues(inst.installmentNumber)}
                    className="h-7 px-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] shrink-0"
                  >
                    Aplicar Valor e Vencimento do Boleto
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BoletoViewerModal
        isOpen={viewerData.isOpen}
        onClose={() => setViewerData({ isOpen: false })}
        boletoUrl={viewerData.item?.boletoUrl}
        fileName={viewerData.item?.originalBoletoName}
        invoiceNumber={invoiceNumber}
        installmentText={
          viewerData.item
            ? `Parcela ${viewerData.item.installmentNumber}/${installments.length}`
            : undefined
        }
        supplier={supplierName}
        amount={viewerData.item?.amount}
        dueDate={viewerData.item?.dueDate}
        barcode={viewerData.item?.barcode}
        linhaDigitavel={viewerData.item?.linhaDigitavel}
      />
    </div>
  );
};

export default InstallmentsBoletosPanel;

