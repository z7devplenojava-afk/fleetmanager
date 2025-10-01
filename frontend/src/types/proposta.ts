// Tipos para cada seção da proposta comercial

export interface MaoDeObraSection {
  salarioPorteiro: number;
  quantidadePorteiros: number;
  adicionalNoturnoPercent: number;
  adicionalNoturnoValor: number;
  reflexoAdicional: number;
  encargosPercent: number;
  encargosValor: number;
  subtotal: number;
  total: number;
}

export interface MateriaisSection {
  uniformeQuantidade: number;
  uniformeUnitario: number;
  equipamentosQuantidade: number;
  equipamentosUnitario: number;
  subtotal: number;
}

export interface BDISection {
  taxaAdministracaoPercent: number;
  taxaAdministracaoValor: number;
  lucroPercent: number;
  lucroValor: number;
  subtotal: number;
}

export interface ImpostosSection {
  cofinsPercent: number;
  cofinsValor: number;
  pisPercent: number;
  pisValor: number;
  issqnPercent: number;
  issqnValor: number;
  irPercent: number;
  irValor: number;
  csllPercent: number;
  csllValor: number;
  total: number;
}

export interface ResultadoFinalSection {
  valorMensal: number;
  valorAnual: number;
}

export interface PropostaComercial {
  descricaoServico: string;
  maoDeObra: MaoDeObraSection;
  materiais: MateriaisSection;
  bdi: BDISection;
  impostos: ImpostosSection;
  resultado: ResultadoFinalSection;
} 