export type RondaStatus = 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'ATRASADA';
export type RondaTipo = 'PREVENTIVA' | 'PATRULHAMENTO' | 'VIGILANCIA' | 'EMERGENCIA' | 'ESPECIAL';
export type RondaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface Ronda {
  id: string;
  nome: string;
  descricao?: string;
  tipo: RondaTipo;
  prioridade: RondaPrioridade;
  status: RondaStatus;
  dataInicio: string;
  dataFim: string;
  duracaoEstimada: number; // em minutos
  duracaoReal?: number; // em minutos
  responsavelId: string;
  responsavelNome: string;
  supervisorId?: string;
  supervisorNome?: string;
  localId: string;
  localNome: string;
  endereco: string;
  observacoes?: string;
  checkpoints: RondaCheckpoint[];
  equipamentos: RondaEquipamento[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface RondaCheckpoint {
  id: string;
  rondaId: string;
  nome: string;
  descricao?: string;
  ordem: number;
  latitude?: number;
  longitude?: number;
  endereco: string;
  obrigatorio: boolean;
  tempoEstimado: number; // em minutos
  tempoReal?: number; // em minutos
  status: 'PENDENTE' | 'VISITADO' | 'PULADO' | 'ATRASADO';
  dataVisita?: string;
  observacoes?: string;
  fotos?: string[];
  assinatura?: string;
}

export interface RondaEquipamento {
  id: string;
  rondaId: string;
  equipamentoId: string;
  equipamentoNome: string;
  equipamentoTipo: string;
  numeroSerie?: string;
  status: 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'DANIFICADO';
  dataRetirada?: string;
  dataDevolucao?: string;
  observacoes?: string;
}

export interface CreateRondaDTO {
  nome: string;
  descricao?: string;
  tipo: RondaTipo;
  prioridade: RondaPrioridade;
  dataInicio: string;
  dataFim: string;
  duracaoEstimada: number;
  responsavelId: string;
  supervisorId?: string;
  localId: string;
  endereco: string;
  observacoes?: string;
  checkpoints: CreateRondaCheckpointDTO[];
  equipamentos: CreateRondaEquipamentoDTO[];
}

export interface CreateRondaCheckpointDTO {
  nome: string;
  descricao?: string;
  ordem: number;
  latitude?: number;
  longitude?: number;
  endereco: string;
  obrigatorio: boolean;
  tempoEstimado: number;
}

export interface CreateRondaEquipamentoDTO {
  equipamentoId: string;
  observacoes?: string;
}

export interface UpdateRondaDTO extends Partial<CreateRondaDTO> {
  id: string;
}

export interface RondaFilters {
  status?: RondaStatus;
  tipo?: RondaTipo;
  prioridade?: RondaPrioridade;
  responsavelId?: string;
  localId?: string;
  dataInicio?: string;
  dataFim?: string;
  searchTerm?: string;
}

export interface RondaStats {
  total: number;
  agendadas: number;
  emAndamento: number;
  concluidas: number;
  canceladas: number;
  atrasadas: number;
  percentualConclusao: number;
  tempoMedioConclusao: number;
  rondasHoje: number;
  rondasSemana: number;
}

export interface RondaRelatorio {
  id: string;
  rondaId: string;
  rondaNome: string;
  dataInicio: string;
  dataFim: string;
  duracaoReal: number;
  status: RondaStatus;
  responsavelNome: string;
  localNome: string;
  checkpointsVisitados: number;
  checkpointsTotal: number;
  percentualConclusao: number;
  observacoes?: string;
  createdAt: string;
}
