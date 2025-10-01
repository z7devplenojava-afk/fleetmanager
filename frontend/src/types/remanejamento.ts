export type RemanejamentoTipo = 
  | 'TRANSFERENCIA_UNIDADE' 
  | 'TRANSFERENCIA_POSTO_TRABALHO'
  | 'TROCA_FUNCAO' 
  | 'PROMOCAO' 
  | 'COBRIR_FERIAS'
  | 'COBRIR_FALTA'
  | 'PLANTAO'
  | 'OUTROS';

export interface Remanejamento {
  id?: string;
  employee: { id: string; name?: string };
  tipo: RemanejamentoTipo;
  origem: string;
  destino: string;
  dataRemanejamento: string;
  observacao?: string;
} 