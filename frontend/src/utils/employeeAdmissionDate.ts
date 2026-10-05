/**
 * Data de hoje no fuso local (yyyy-MM-dd), sem usar toISOString (UTC).
 */
export function todayIsoDateLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Converte hireDate do cadastro para formato ISO (yyyy-MM-dd) usado nos formulários de documentos.
 * Usa só a parte da data para evitar off-by-one por timezone (UTC vs America/Sao_Paulo).
 */
export function employeeAdmissionIsoDate(hireDate?: string | null): string | undefined {
  if (!hireDate) return undefined;
  const dateOnly = String(hireDate).split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : undefined;
}

/**
 * Retorna a data de admissão ou a data atual como fallback (yyyy-MM-dd).
 */
export function employeeAdmissionIsoDateOrToday(hireDate?: string | null): string {
  return employeeAdmissionIsoDate(hireDate) ?? todayIsoDateLocal();
}

/**
 * Formata hireDate/ISO date-only para dd/MM/yyyy sem deslocar o dia.
 */
export function formatAdmissionDateBr(hireDate?: string | null): string {
  const iso = employeeAdmissionIsoDate(hireDate);
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
