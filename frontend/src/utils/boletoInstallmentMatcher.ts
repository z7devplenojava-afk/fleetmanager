import { BoletoParsedDTO } from '@/services/contasAPagarService';

export interface InstallmentBoletoItem {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  barcode?: string;
  linhaDigitavel?: string;
  boletoUrl?: string;
  originalBoletoName?: string;
  boletoAmount?: number;
  boletoDueDate?: string;
  bankName?: string;
  divergenceAlert?: string;
}

export const toIsoDateOnly = (raw?: string | Date | null): string => {
  if (!raw) return new Date().toISOString().split('T')[0];
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return new Date().toISOString().split('T')[0];
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(raw).split('T')[0];
};

export const parseIsoDateLocal = (iso?: string): Date => {
  if (!iso) return new Date();
  const clean = iso.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const formatDateBR = (iso?: string): string => {
  if (!iso) return 'sem data';
  const clean = iso.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return clean;
};

export const computeBoletoDivergence = (
  boleto: BoletoParsedDTO,
  targetAmount: number,
  targetDueDate?: string
): string | undefined => {
  const bAmount = Number(boleto.amount || 0);
  const bDate = boleto.dueDate ? toIsoDateOnly(boleto.dueDate) : undefined;
  const tDate = targetDueDate ? toIsoDateOnly(targetDueDate) : undefined;

  const diffVal = bAmount > 0 && targetAmount > 0 && Math.abs(bAmount - targetAmount) > 0.05;
  const diffDate = Boolean(bDate && tDate && bDate !== tDate);

  if (!diffVal && !diffDate) return undefined;

  const valBol = bAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const valTgt = targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Boleto: R$ ${valBol} (${formatDateBR(bDate)}) vs Parcela: R$ ${valTgt} (${formatDateBR(tDate)})`;
};

export const attachSingleBoletoToInstallment = (
  installment: InstallmentBoletoItem,
  boleto: BoletoParsedDTO,
  syncIfPlaceholderOrEmpty = false
): InstallmentBoletoItem => {
  const bAmount = Number(boleto.amount || 0);
  const bDate = boleto.dueDate ? toIsoDateOnly(boleto.dueDate) : undefined;

  const nextAmount =
    syncIfPlaceholderOrEmpty && bAmount > 0 && installment.amount <= 0
      ? bAmount
      : installment.amount;
  const nextDueDate =
    syncIfPlaceholderOrEmpty && bDate
      ? bDate
      : installment.dueDate;

  const divergenceAlert = computeBoletoDivergence(boleto, nextAmount, nextDueDate);

  return {
    ...installment,
    amount: nextAmount,
    dueDate: nextDueDate,
    barcode: boleto.barcode || boleto.linhaDigitavel || installment.barcode,
    linhaDigitavel: boleto.linhaDigitavel || installment.linhaDigitavel,
    boletoUrl: boleto.fileUrl || installment.boletoUrl,
    originalBoletoName: boleto.originalFileName || installment.originalBoletoName,
    boletoAmount: bAmount > 0 ? bAmount : undefined,
    boletoDueDate: bDate,
    bankName: boleto.bankName || installment.bankName,
    divergenceAlert,
  };
};

/**
 * Faz o matching inteligente de boletos em lote contra parcelas existentes.
 * Se não houver parcelas ou houver apenas 1 placeholder e chegarem múltiplos boletos,
 * cria automaticamente as N parcelas ordenadas por vencimento usando os dados dos boletos.
 */
export const matchBoletosBatchToInstallments = (
  existingInstallments: InstallmentBoletoItem[],
  parsedBoletos: BoletoParsedDTO[],
  options?: { expandIfSingleOrEmpty?: boolean }
): {
  installments: InstallmentBoletoItem[];
  matchedCount: number;
  createdFromBatch: boolean;
} => {
  if (!parsedBoletos || parsedBoletos.length === 0) {
    return { installments: existingInstallments, matchedCount: 0, createdFromBatch: false };
  }

  const expand = options?.expandIfSingleOrEmpty ?? true;
  const shouldCreateFromBatch =
    existingInstallments.length === 0 ||
    (expand && existingInstallments.length === 1 && parsedBoletos.length > 1 && !existingInstallments[0].boletoUrl);

  if (shouldCreateFromBatch) {
    const sorted = [...parsedBoletos].sort((a, b) => {
      const da = a.dueDate || '9999-12-31';
      const db = b.dueDate || '9999-12-31';
      return da.localeCompare(db);
    });

    const created: InstallmentBoletoItem[] = sorted.map((b, idx) => {
      const fallbackDue = existingInstallments[0]?.dueDate || toIsoDateOnly(new Date());
      return {
        installmentNumber: idx + 1,
        dueDate: b.dueDate ? toIsoDateOnly(b.dueDate) : fallbackDue,
        amount: b.amount && b.amount > 0 ? Number(b.amount) : 0,
        barcode: b.barcode || b.linhaDigitavel || undefined,
        linhaDigitavel: b.linhaDigitavel || undefined,
        boletoUrl: b.fileUrl || undefined,
        originalBoletoName: b.originalFileName || undefined,
        boletoAmount: b.amount && b.amount > 0 ? Number(b.amount) : undefined,
        boletoDueDate: b.dueDate ? toIsoDateOnly(b.dueDate) : undefined,
        bankName: b.bankName || undefined,
        divergenceAlert: undefined,
      };
    });

    return {
      installments: created,
      matchedCount: created.length,
      createdFromBatch: true,
    };
  }

  const updated = existingInstallments.map((inst) => ({ ...inst }));
  const usedIndices = new Set<number>();
  let matchedCount = 0;

  for (const boleto of parsedBoletos) {
    const bAmount = Number(boleto.amount || 0);
    const bDate = boleto.dueDate ? toIsoDateOnly(boleto.dueDate) : undefined;

    // 1. Melhor match: valor + vencimento iguais
    let idx = updated.findIndex(
      (inst, i) =>
        !usedIndices.has(i) &&
        bAmount > 0 &&
        Math.abs(inst.amount - bAmount) <= 0.05 &&
        bDate &&
        toIsoDateOnly(inst.dueDate) === bDate
    );

    // 2. Match por valor equivalente
    if (idx === -1 && bAmount > 0) {
      idx = updated.findIndex(
        (inst, i) => !usedIndices.has(i) && Math.abs(inst.amount - bAmount) <= 0.05
      );
    }

    // 3. Match por data de vencimento
    if (idx === -1 && bDate) {
      idx = updated.findIndex(
        (inst, i) => !usedIndices.has(i) && toIsoDateOnly(inst.dueDate) === bDate
      );
    }

    // 4. Próxima parcela disponível sem boleto anexado
    if (idx === -1) {
      idx = updated.findIndex((inst, i) => !usedIndices.has(i) && !inst.boletoUrl);
    }

    // 5. Fallback: qualquer parcela ainda não usada neste lote
    if (idx === -1) {
      idx = updated.findIndex((_, i) => !usedIndices.has(i));
    }

    if (idx !== -1) {
      usedIndices.add(idx);
      updated[idx] = attachSingleBoletoToInstallment(updated[idx], boleto, true);
      matchedCount++;
    } else {
      // Veio mais boleto que parcela: adiciona nova parcela ao final
      const nextNum = updated.length + 1;
      updated.push({
        installmentNumber: nextNum,
        dueDate: bDate || toIsoDateOnly(new Date()),
        amount: bAmount > 0 ? bAmount : 0,
        barcode: boleto.barcode || boleto.linhaDigitavel || undefined,
        linhaDigitavel: boleto.linhaDigitavel || undefined,
        boletoUrl: boleto.fileUrl || undefined,
        originalBoletoName: boleto.originalFileName || undefined,
        boletoAmount: bAmount > 0 ? bAmount : undefined,
        boletoDueDate: bDate,
        bankName: boleto.bankName || undefined,
      });
      usedIndices.add(updated.length - 1);
      matchedCount++;
    }
  }

  return {
    installments: updated,
    matchedCount,
    createdFromBatch: false,
  };
};

