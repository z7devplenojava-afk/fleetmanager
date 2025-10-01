// Tipos para o módulo operacional

export interface PostoOperacional {
  id: string;
  nome: string;
  cliente: string;
  endereco: string;
  tipo: 'HOTEL' | 'SHOPPING' | 'EMPRESA' | 'RESIDENCIAL' | 'OUTRO';
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO';
  horarioFuncionamento: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuncionarioOperacional {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  telefone: string;
  email: string;
  cargo: string;
  status: 'ATIVO' | 'FERIAS' | 'FOLGA' | 'AFASTADO' | 'INATIVO';
  dataAdmissao: string;
  observacoes?: string;
}

export interface EscalaOperacional {
  id: string;
  funcionarioId: string;
  funcionario: FuncionarioOperacional;
  postoId: string;
  posto: PostoOperacional;
  tipoEscala: '6X1' | '7X19' | '20X08' | 'NOTURNO' | 'DIURNO' | 'ESPECIAL';
  dataInicio: string;
  dataFim: string;
  horarioInicio: string;
  horarioFim: string;
  status: 'ATIVA' | 'FOLGA' | 'FERIAS' | 'COBERTURA' | 'FALTA';
  observacoes?: string;
}

export interface FeriasOperacional {
  id: string;
  funcionarioId: string;
  funcionario: FuncionarioOperacional;
  dataInicio: string;
  dataFim: string;
  funcionarioCoberturaId?: string;
  funcionarioCobertura?: FuncionarioOperacional;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
  observacoes?: string;
  createdAt: string;
}

export interface TarefaOperacional {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'LIMPEZA' | 'MANUTENCAO' | 'SEGURANCA' | 'ADMINISTRATIVO' | 'OUTRO';
  postoId?: string;
  posto?: PostoOperacional;
  funcionarioResponsavelId?: string;
  funcionarioResponsavel?: FuncionarioOperacional;
  dataAgendamento: string;
  dataConclusao?: string;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  observacoes?: string;
}

export interface CoberturaOperacional {
  id: string;
  funcionarioOriginalId: string;
  funcionarioOriginal: FuncionarioOperacional;
  funcionarioCoberturaId: string;
  funcionarioCobertura: FuncionarioOperacional;
  postoId: string;
  posto: PostoOperacional;
  dataInicio: string;
  dataFim: string;
  motivo: 'FERIAS' | 'FALTA' | 'EMERGENCIA' | 'MANUTENCAO' | 'OUTRO';
  status: 'ATIVA' | 'FINALIZADA' | 'CANCELADA';
  observacoes?: string;
}

export interface RelatorioOperacional {
  id: string;
  tipo: 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'FERIAS' | 'COBERTURAS' | 'TAREFAS';
  periodo: string;
  dados: {
    totalPostos: number;
    postosAtivos: number;
    totalFuncionarios: number;
    funcionariosAtivos: number;
    funcionariosFerias: number;
    funcionariosFolga: number;
    coberturasAtivas: number;
    tarefasPendentes: number;
    tarefasConcluidas: number;
  };
  createdAt: string;
}

// DTOs para criação/atualização
export interface CreatePostoOperacionalDTO {
  nome: string;
  cliente: string;
  endereco: string;
  tipo: string;
  horarioFuncionamento: string;
  observacoes?: string;
}

export interface CreateEscalaOperacionalDTO {
  funcionarioId: string;
  postoId: string;
  tipoEscala: string;
  dataInicio: string;
  dataFim: string;
  horarioInicio: string;
  horarioFim: string;
  observacoes?: string;
}

export interface CreateFeriasOperacionalDTO {
  funcionarioId: string;
  dataInicio: string;
  dataFim: string;
  funcionarioCoberturaId?: string;
  observacoes?: string;
}

export interface CreateTarefaOperacionalDTO {
  titulo: string;
  descricao: string;
  tipo: string;
  postoId?: string;
  funcionarioResponsavelId?: string;
  dataAgendamento: string;
  prioridade: string;
  observacoes?: string;
}

export interface CreateCoberturaOperacionalDTO {
  funcionarioOriginalId: string;
  funcionarioCoberturaId: string;
  postoId: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  observacoes?: string;
}
