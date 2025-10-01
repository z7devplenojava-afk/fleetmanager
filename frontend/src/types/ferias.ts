export type FeriasStatus = 'PENDENTE' | 'APROVADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
export type FeriasTipo = 'FERIAS_NORMAIS' | 'FERIAS_VENDIDAS' | 'ABONO_PECUNIARIO';
export type AfastamentoTipo = 'ATESTADO' | 'LICENCA_MEDICA' | 'LICENCA_MATERNIDADE' | 'LICENCA_PATERNIDADE' | 'SUSPENSAO' | 'OUTROS';

export interface FeriasPeriodo {
  id: string;
  employeeId: string;
  employeeName: string;
  periodoAquisitivo: string; // ex: "2024/2025"
  dataInicio: string;
  dataFim: string;
  status: FeriasStatus;
  tipo: FeriasTipo;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
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
  dataInicio: string;
  dataFim: string;
  tipo: FeriasTipo;
  observacoes?: string;
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