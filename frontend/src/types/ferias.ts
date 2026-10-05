export type FeriasStatus = 'PENDENTE' | 'APROVADO' | 'REJECTED' | 'CANCELADO';
export type FeriasTipo = 'FERIAS_NORMAIS' | 'FERIAS_VENDIDAS' | 'ABONO_PECUNIARIO';
export type AfastamentoTipo = 'ATESTADO' | 'LICENCA_MEDICA' | 'LICENCA_MATERNIDADE' | 'LICENCA_PATERNIDADE' | 'SUSPENSAO' | 'OUTROS';

export interface FeriasPeriodo {
  id: string;
  employeeId: string;
  employeeName: string;
  periodoAquisitivo: string; // ex: "2024/2025"
  periodoAquisitivoId?: string | null;
  dataInicio: string;
  dataFim: string;
  status: FeriasStatus;
  tipo: FeriasTipo;
  observacoes?: string;
  /** Abono pecuniário já abatido do saldo (dias) */
  diasAbono?: number;
  /** Blocos fracionados do gozo (quando houver fracionamento) */
  blocos?: FeriasBloco[] | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Afastamento {
  id: string;
  employeeId: string;
  employeeName: string;
  tipo: AfastamentoTipo;
  dataInicio: string;
  dataFim: string;
  status: FeriasStatus;
  motivo: string;
  documento?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeriasRequest {
  employeeId: string;
  periodoAquisitivo: string;
  periodoAquisitivoId?: string;
  dataInicio: string;
  dataFim: string;
  tipo: FeriasTipo;
  observacoes?: string;
  /** Blocos fracionados (máx. 3, um com >= 14 dias e demais >= 5 dias — Art. 134 §1º) */
  blocos?: FeriasBloco[];
  /** Abono pecuniário em dias (máx. 1/3 do saldo — Art. 143 §1º) */
  diasAbono?: number;
}

export interface UpdateFeriasRequest {
  dataInicio?: string;
  dataFim?: string;
  status?: FeriasStatus;
  tipo?: FeriasTipo;
  observacoes?: string;
}

export interface CreateAfastamentoRequest {
  employeeId: string;
  tipo: AfastamentoTipo;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  documento?: string;
  observacoes?: string;
}

export interface UpdateAfastamentoRequest {
  employeeId?: string; // Necessário para o backend atualizar corretamente
  dataInicio?: string;
  dataFim?: string;
  status?: FeriasStatus;
  tipo?: AfastamentoTipo;
  motivo?: string;
  documento?: string;
  observacoes?: string;
}

export interface FeriasFilters {
  employeeId?: string;
  status?: FeriasStatus;
  tipo?: FeriasTipo;
  periodoAquisitivo?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface AfastamentoFilters {
  employeeId?: string;
  status?: FeriasStatus;
  tipo?: AfastamentoTipo;
  dataInicio?: string;
  dataFim?: string;
}

// ---------------------------------------------------------------------------
// Período Aquisitivo (CLT Art. 129-137) — Fase 1 do módulo de férias
// ---------------------------------------------------------------------------

export type PeriodoAquisitivoStatus = 'EM_ANDAMENTO' | 'CONCESSIVO' | 'QUITADO' | 'EXPIRADO';
export type PeriodoAquisitivoOrigem = 'ADMISSAO' | 'COLETIVA' | 'RETORNO_AFASTAMENTO' | 'MANUAL';

export interface PeriodoAquisitivo {
  id: string;
  employeeId: string;
  employeeName?: string;
  dataInicio: string;
  dataFim: string;
  limiteConcessivo: string;
  diasDireito: number;
  diasSaldo: number;
  diasUtilizados: number;
  faltasInjustificadas: number;
  status: PeriodoAquisitivoStatus;
  origem: PeriodoAquisitivoOrigem;
  observacoes?: string;
}

export interface SaldoFerias {
  periodoAquisitivoId: string | null;
  dataInicio: string;
  dataFim: string;
  limiteConcessivo: string;
  diasDireito: number;
  diasSaldo: number;
  diasUtilizados: number;
  faltasInjustificadas: number;
  status: PeriodoAquisitivoStatus;
  primeiroAnoContrato: boolean;
  diasAteLimiteConcessivo: number;
  maximoAbonoPecuniario: number;
}

export interface FeriasBloco {
  inicio: string;
  fim: string;
  dias: number;
}

export interface ValidacaoFerias {
  aprovado: boolean;
  violacoes: string[];
  alertas: string[];
  blocosCalculados: FeriasBloco[];
  diasGozoCalculados: number;
  periodoAquisitivoId: string | null;
  limiteConcessivo: string;
  saldoDisponivel: number;
}

export interface ValidacaoFeriasRequest {
  employeeId: string;
  dataInicio: string;
  blocos?: FeriasBloco[];
  diasAbono?: number;
  periodoAquisitivoId?: string;
}

// ---------------------------------------------------------------------------
// Alertas de periodo concessivo (RF-07) — Fase 2
// ---------------------------------------------------------------------------

export interface AlertaConcessivo {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  dataInicio: string;
  dataFim: string;
  limiteConcessivo: string;
  diasDireito: number;
  diasSaldo: number;
  diasUtilizados: number;
  status: PeriodoAquisitivoStatus;
}

// ---------------------------------------------------------------------------
// Ferias Coletivas (CLT Art. 139/140) — RF-04 — Fase 2
// ---------------------------------------------------------------------------

export type FeriasColetivaStatus = 'Planejado' | 'Em Andamento' | 'Concluido' | 'Cancelado';

export interface FeriasColetiva {
  id: string;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  diasDuracao: number;
  abrangeTodaEmpresa: boolean;
  departamentoIds?: string[] | null;
  companyId?: string | null;
  unitId?: string | null;
  status: FeriasColetivaStatus;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeriasColetivaRequest {
  titulo: string;
  dataInicio: string;
  dataFim: string;
  abrangeTodaEmpresa: boolean;
  departamentoIds?: string[];
  observacoes?: string;
}

export interface ResultadoProcessamentoColetiva {
  coletivaId: string;
  totalAlvos: number;
  processados: number;
  pulados: number;
  afastadasMaternidade: number;
  diasGozo: number;
  diasLicencaRemunerada: number;
  status: string;
}