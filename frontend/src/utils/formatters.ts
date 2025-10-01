/**
 * Formata uma string de data (ex: "2024-07-31") para o padrão brasileiro (ex: "31/07/2024").
 * @param dateString A data em formato de string.
 * @returns A data formatada ou '-' se a entrada for nula/indefinida.
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return '-';
  }
  try {
    // Adicionar T00:00:00 para garantir que a data seja interpretada no fuso horário local
    // e não seja afetada por ajustes de fuso (ex: UTC-3 fazendo a data voltar um dia).
    const date = new Date(`${dateString}T00:00:00`);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (error) {
    console.error("Erro ao formatar data:", dateString, error);
    return 'Data inválida';
  }
};

/**
 * Formata um valor numérico para o padrão de moeda brasileira (BRL).
 * @param value O valor numérico.
 * @returns O valor formatado como moeda (ex: "R$ 1.234,56") ou '-' se a entrada for nula/indefinida.
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}; 