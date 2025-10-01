export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  possuiWhatsapp: boolean;
  caminhoPdf?: string;
  mesReferencia?: string;
  anoReferencia?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvioRequest {
  tipo: 'email' | 'whatsapp';
  funcionarioId?: number;
  funcionarioIds?: number[];
  mensagem?: string;
  assunto?: string;
}

export interface DetalheEnvio {
  funcionarioId: number;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  enviado: boolean;
  erro?: string;
}

export interface EnvioResponse {
  sucesso: boolean;
  mensagem: string;
  dataEnvio: string;
  tipoEnvio: string;
  totalEnviados: number;
  totalFalhas: number;
  detalhes: DetalheEnvio[];
}

export interface FuncionarioFilters {
  nome?: string;
  cpf?: string;
  mesReferencia?: string;
  anoReferencia?: string;
  possuiEmail?: boolean;
  possuiWhatsapp?: boolean;
}

export interface Periodo {
  mesReferencia: string;
  anoReferencia: string;
} 