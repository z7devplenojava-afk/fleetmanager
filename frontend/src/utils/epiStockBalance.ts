/**
 * Regras de saldo de estoque usadas pelo formulário da Ficha de Entrega de EPI.
 *
 * O backend, ao gravar uma ficha concluída, ESTORNA tudo que ela já havia baixado
 * (a requisição REQ-EPI gerada por ela) e BAIXA de novo todos os itens ativos. Se o
 * saldo não cobrir a quantidade pedida, a API responde 400
 * ("Quantidade insuficiente em estoque"). Estas funções replicam essa conta no
 * cliente para bloquear o envio com uma mensagem clara.
 */

export interface EpiStockRow {
  nome?: string;
  quantidade?: string | number;
  stockItemId?: string;
  /** Data da substituição — item substituído não gera nova baixa. */
  dataSubstituicao?: string;
  /** Data da devolução — item devolvido não gera nova baixa. */
  dataDevolucao?: string;
}

export interface EpiStockItemRef {
  id: string;
  currentQuantity?: number | null;
}

/**
 * Quantidade somada por item de estoque considerando apenas itens ativos.
 * Devolvidos/substituídos não geram baixa — mesma regra do backend.
 */
export function sumActiveStockQuantities(
  items: Array<{ stockItemId?: string; quantity?: number | null; substitutedDate?: string; returnedDate?: string }> | undefined,
): Record<string, number> {
  const totals: Record<string, number> = {};
  (items || []).forEach((item) => {
    if (!item.stockItemId) return;
    if (item.substitutedDate || item.returnedDate) return;
    const qty = Math.max(1, Number(item.quantity) || 1);
    totals[item.stockItemId] = (totals[item.stockItemId] || 0) + qty;
  });
  return totals;
}

/**
 * Itens cujo saldo disponível não cobre a quantidade pedida.
 *
 * @param alreadyDeductedByForm quantidades que ESTA ficha já baixou no estoque — como o
 * backend estorna antes de baixar de novo, esse valor volta a ficar disponível.
 * Deve ser `{}` quando a ficha ainda não foi concluída (nada foi baixado).
 */
export function findInsufficientStockRows(
  rows: EpiStockRow[],
  stockItems: EpiStockItemRef[],
  alreadyDeductedByForm: Record<string, number> = {},
): string[] {
  const insufficient: string[] = [];

  for (const row of rows) {
    if (!row.stockItemId || row.stockItemId === 'none') continue;
    // Devolução/substituição não gera nova baixa no estoque.
    if (row.dataDevolucao || row.dataSubstituicao) continue;

    const stockItem = stockItems.find((item) => item.id === row.stockItemId);
    // Vínculo inexistente é tratado pela validação de conclusão da ficha.
    if (!stockItem) continue;

    const required = Math.max(1, parseInt(String(row.quantidade ?? '').trim(), 10) || 1);
    const available = (Number(stockItem.currentQuantity) || 0) + (alreadyDeductedByForm[row.stockItemId] || 0);

    if (required > available) {
      insufficient.push(`${row.nome || 'Item'} (pedido ${required}, disponível ${available})`);
    }
  }

  return insufficient;
}

/** Mensagem para o usuário, ou `null` quando todos os itens têm saldo. */
export function buildInsufficientStockMessage(insufficient: string[]): string | null {
  if (insufficient.length === 0) return null;
  return `Saldo insuficiente no estoque: ${insufficient.join('; ')}. Cadastre uma entrada no estoque ou ajuste a quantidade antes de concluir.`;
}
