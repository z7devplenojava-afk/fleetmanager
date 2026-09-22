// Definição do tipo UUID para consistência
export type UUID = string;

export interface EmployeeDocument {
  id: UUID;
  type: string; // RG, CPF, CNH, etc.
  number: string;
  fileUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface EmployeeBankData {
  bank: string;
  agency: string;
  account: string;
  type: string; // Conta Corrente, Poupança, etc.
}

export interface EmployeeHistoryItem {
  id: UUID;
  type: 'admissao' | 'remanejamento' | 'premiacao' | 'advertencia' | 'falta' | 'afastamento';
  date: string;
  description: string;
  relatedDocumentUrl?: string;
}

// Interface principal compatível com o backend
export interface Employee {
  id: UUID; // UUID do backend
  name: string;
  cpf: string;
  rg: string;
  birthDate?: string; // LocalDate do backend
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  photoUrl?: string;
  currentScale?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | string;
  registrationNumber?: string;
  hireDate?: string; // LocalDate do backend
  terminationDate?: string; // LocalDate do backend
  status?: string;
  notes?: string;
  
  // Campos adicionais do backend
  tituloEleitor?: string;
  tituloEleitorDataExpedicao?: string;
  tituloEleitorValidade?: string;
  nomeConselhoRegional?: string;
  carteiraIdentidade?: string;
  grauInstrucao?: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cep?: string;
  ctps?: string;
  cbo?: string;
  pis?: string;
  
  // Campos de CNH
  cnhNumber?: string;
  cnhExpirationDate?: string;
  cnhCategory?: string;
  
  // Campos de CTPS
  ctpsSeries?: string;
  ctpsIssueDate?: string;
  ctpsIssuingAgency?: string;
  ctpsRural?: string;
  
  // Documentos adicionais
  tituloEleitorZona?: string;
  tituloEleitorSecao?: string;
  carteiraIdentidadeOrgaoEmissor?: string;
  carteiraIdentidadeDataEmissao?: string;
  certificadoMilitar?: string;
  
  // Informações de trabalho
  cbo?: string;
  salario?: number; // BigDecimal do backend
  salarioPorExtenso?: string;
  periodoPagamento?: string;
  horarioTrabalho?: string; // Período de Trabalho (ex: "18:00 ÀS 06:00 H")
  horarioTrabalhoIntervalo?: string; // Intervalo (ex: "23:00 ÀS 00:00 H")
  diasTrabalho?: string; // Dias de Trabalho (ex: "12X36")
  prazoExperienciaTexto?: string; // Prazo de Experiência em texto (ex: "45 DIAS")
  prorrogacaoExperiencia?: string; // Prorrogação do prazo de experiência
  folgaSemanal?: string; // Dias de Folga (ex: "1ª Escola")
  escalaTrabalho?: string; // Escala de Trabalho
  
  // FGTS
  fgtsOptante?: boolean;
  fgtsDataOpcao?: string;
  fgtsBancoDepositario?: string;
  fgtsDataRetratacao?: string;
  
  // Empresa
  empresaNome?: string;
  empresaEndereco?: string;
  empresaCnpj?: string;
  vistoFiscalizacao?: string;
  
  // Informações pessoais adicionais
  nomePai?: string;
  nomeMae?: string;
  localNascimento?: string;
  municipioNascimento?: string;
  estadoNascimento?: string;
  sexo?: string;
  grauInstrucao?: string;
  matriculaEsocial?: string;
  
  // PIS
  pisDataCadastro?: string;
  pisBancoDepositario?: string;
  pisEnderecoBanco?: string;
  pisCodigoBanco?: string;
  pisCodigoAgencia?: string;
  
  // Estrangeiros
  carteiraModelo19?: string;
  registroGeralEstrangeiro?: string;
  rneNumero?: string; // RNE nº
  rneValidade?: string; // Validade do RNE
  casadoBrasileiro?: boolean;
  nomeConjugeEstrangeiro?: string;
  temFilhosBrasileiros?: boolean;
  quantidadeFilhosBrasileiros?: number;
  dataChegadaBrasil?: string;
  naturalizado?: boolean;
  decretoNaturalizacao?: string;
  // RIC - Registro de Identidade Civil (para naturalizados)
  ricNumero?: string; // Nº RIC
  ricOrgaoEmissor?: string; // Órgão Emissor do RIC
  ricDataEmissao?: string; // Data de Emissão do RIC
  tipoVisto?: string; // Tipo de Visto
  
  // Assinaturas e controle
  assinaturaFuncionario?: string;
  dataRescisao?: string;
  possuiWhatsapp?: boolean;
  caminhoPdf?: string;
  mesReferencia?: string;
  anoReferencia?: string;
  
  // Benefícios, descontos, horas extras e afastamento (Folha de Pagamento)
  mensalidadePlanoSaude?: number;
  coparticipacaoSaude?: number;
  planoOdontologico?: number;
  valeTransporte?: number;
  descontoMultas?: number;
  descontoAvarias?: number;
  valeAdiantamento?: number;
  adicionalNoturno?: number;
  horasExtras50?: number;
  horasExtras60?: number;
  horasExtras100?: number;
  afastamentoMotivo?: string;
  afastamentoData?: string;
  
  // Dados do cônjuge
  spouseName?: string;
  spouseCpf?: string;
  spouseRg?: string;
  spouseBirthDate?: string;
  spouseProfession?: string;
  spousePhone?: string;
  spouseEmail?: string;
  
  // Campos da ficha de registro
  empresaNome?: string;
  empresaEndereco?: string;
  empresaCnpj?: string;
  tituloEleitor?: string;
  tituloEleitorDataExpedicao?: string;
  tituloEleitorValidade?: string;
  nomeConselhoRegional?: string;
  tituloEleitorZona?: string;
  tituloEleitorSecao?: string;
  carteiraIdentidadeOrgaoEmissor?: string;
  carteiraIdentidadeDataEmissao?: string;
  certificadoMilitar?: string;
  nomePai?: string;
  nomeMae?: string;
  localNascimento?: string;
  municipioNascimento?: string;
  estadoNascimento?: string;
  sexo?: string;
  grauInstrucao?: string;
  matriculaEsocial?: string;
  cbo?: string;
  salario?: number;
  salarioPorExtenso?: string;
  periodoPagamento?: string;
  horarioTrabalho?: string; // Período de Trabalho (ex: "18:00 ÀS 06:00 H")
  horarioTrabalhoIntervalo?: string; // Intervalo (ex: "23:00 ÀS 00:00 H")
  diasTrabalho?: string; // Dias de Trabalho (ex: "12X36")
  prazoExperienciaTexto?: string; // Prazo de Experiência em texto (ex: "45 DIAS")
  prorrogacaoExperiencia?: string; // Prorrogação do prazo de experiência
  folgaSemanal?: string; // Dias de Folga (ex: "1ª Escola")
  escalaTrabalho?: string; // Escala de Trabalho
  fgtsOptante?: boolean;
  fgtsDataOpcao?: string;
  fgtsBancoDepositario?: string;
  fgtsDataRetratacao?: string;
  pisDataCadastro?: string;
  pisBancoDepositario?: string;
  pisEnderecoBanco?: string;
  pisCodigoBanco?: string;
  pisCodigoAgencia?: string;
  cnhNumber?: string;
  cnhExpirationDate?: string;
  cnhCategory?: string;
  ctps?: string;
  ctpsRural?: string;
  ctpsSeries?: string;
  ctpsIssueDate?: string;
  ctpsIssuingAgency?: string;
  carteiraModelo19?: string;
  registroGeralEstrangeiro?: string;
  casadoBrasileiro?: boolean;
  nomeConjugeEstrangeiro?: string;
  temFilhosBrasileiros?: boolean;
  quantidadeFilhosBrasileiros?: number;
  dataChegadaBrasil?: string;
  naturalizado?: boolean;
  decretoNaturalizacao?: string;
  vistoFiscalizacao?: string;
  assinaturaFuncionario?: string;
  dataRescisao?: string;
  
  // Relacionamentos (apenas IDs como no backend)
  position?: { 
    id: UUID;
    name?: string;
    description?: string;
  };
  unit?: { 
    id: UUID;
    name?: string;
    description?: string;
  };
  user?: { id: UUID };
  company?: { 
    id: UUID;
    name?: string;
    sigla?: string;
    cnpj?: string;
  };
  workPost?: {
    id: UUID;
    name?: string;
    postCode?: string;
    description?: string;
  };
  department?: {
    id: UUID;
    name?: string;
    description?: string;
  };
  
  // Dados aninhados (opcionais)
  bankData?: EmployeeBankData;
  bankInfo?: {
    bank?: string;
    agency?: string;
    account?: string;
    accountType?: string;
  };
  documents?: EmployeeDocument[];
  history?: EmployeeHistoryItem[];
  dependents?: Array<{
    name: string;
    relationship: string;
    birthDate: string;
    cpf?: string;
    rg?: string;
  }>;
  
  // Dados de exames (ASO e Laudo Psicológico)
  exameMedicoData?: string;
  laudoPsicologicoData?: string;
  nextExameMedico?: string;
  nextLaudoPsicologico?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeDTO {
  name: string;
  cpf: string;
  rg: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  telefoneContato?: string;
  address?: {
    street: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | string;
  enderecoRua?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoEstado?: string;
  enderecoCep?: string;
  registrationNumber?: string;
  hireDate?: string;
  status?: string;
  notes?: string;
  
  // Campos adicionais
  tituloEleitor?: string;
  tituloEleitorDataExpedicao?: string;
  tituloEleitorValidade?: string;
  nomeConselhoRegional?: string;
  carteiraIdentidade?: string;
  grauInstrucao?: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cep?: string;
  ctps?: string;
  cbo?: string;
  pis?: string;
  
  // Campos de CNH
  cnhNumber?: string;
  cnhExpirationDate?: string;
  cnhCategory?: string;
  
  // Campos de CTPS
  ctpsSeries?: string;
  ctpsIssueDate?: string;
  ctpsIssuingAgency?: string;
  ctpsRural?: string;
  
  // Documentos adicionais
  tituloEleitorZona?: string;
  tituloEleitorSecao?: string;
  carteiraIdentidadeOrgaoEmissor?: string;
  carteiraIdentidadeDataEmissao?: string;
  certificadoMilitar?: string;
  
  // Informações de trabalho
  cbo?: string;
  salario?: number;
  salarioPorExtenso?: string;
  periodoPagamento?: string;
  horarioTrabalho?: string; // Período de Trabalho (ex: "18:00 ÀS 06:00 H")
  horarioTrabalhoIntervalo?: string; // Intervalo (ex: "23:00 ÀS 00:00 H")
  diasTrabalho?: string; // Dias de Trabalho (ex: "12X36")
  prazoExperienciaTexto?: string; // Prazo de Experiência em texto (ex: "45 DIAS")
  prorrogacaoExperiencia?: string; // Prorrogação do prazo de experiência
  folgaSemanal?: string; // Dias de Folga (ex: "1ª Escola")
  escalaTrabalho?: string; // Escala de Trabalho
  
  // FGTS
  fgtsOptante?: boolean;
  fgtsDataOpcao?: string;
  fgtsBancoDepositario?: string;
  fgtsDataRetratacao?: string;
  
  // Empresa
  empresaNome?: string;
  empresaEndereco?: string;
  empresaCnpj?: string;
  vistoFiscalizacao?: string;
  
  // Informações pessoais adicionais
  nomePai?: string;
  nomeMae?: string;
  localNascimento?: string;
  municipioNascimento?: string;
  estadoNascimento?: string;
  sexo?: string;
  grauInstrucao?: string;
  matriculaEsocial?: string;
  
  // PIS
  pisDataCadastro?: string;
  pisBancoDepositario?: string;
  pisEnderecoBanco?: string;
  pisCodigoBanco?: string;
  pisCodigoAgencia?: string;
  
  // Estrangeiros
  carteiraModelo19?: string;
  registroGeralEstrangeiro?: string;
  rneNumero?: string; // RNE nº
  rneValidade?: string; // Validade do RNE
  casadoBrasileiro?: boolean;
  nomeConjugeEstrangeiro?: string;
  temFilhosBrasileiros?: boolean;
  quantidadeFilhosBrasileiros?: number;
  dataChegadaBrasil?: string;
  naturalizado?: boolean;
  decretoNaturalizacao?: string;
  // RIC - Registro de Identidade Civil (para naturalizados)
  ricNumero?: string; // Nº RIC
  ricOrgaoEmissor?: string; // Órgão Emissor do RIC
  ricDataEmissao?: string; // Data de Emissão do RIC
  tipoVisto?: string; // Tipo de Visto
  
  // Assinaturas e controle
  assinaturaFuncionario?: string;
  dataRescisao?: string;
  possuiWhatsapp?: boolean;
  
  // Dados do Exame Médico (ASO)
  exameMedicoData?: string;
  exameMedicoTipo?: string; // ADMISSIONAL, DEMISSIONAL, PERIODICO, MUDANCA_FUNCAO, RETORNO_TRABALHO
  exameMedicoDoctor?: { id: string };
  exameMedicoHorario?: string; // Ex: "18:00 ÀS 06:00 H"
  exameMedicoIntervalosRefeicao?: boolean; // true = Sim, false = Não
  exameMedicoObservacoes?: string;
  exameMedicoPrimeiroEmprego?: boolean; // true = Sim, false = Não
  exameMedicoContribuicaoSindicalPaga?: boolean; // true = Sim, false = Não
  
  // Laudo Psicológico (exame psicotecnico)
  laudoPsicologicoData?: string;
  // Próximos vencimentos (calculados pelo backend: data + 1 ano)
  nextExameMedico?: string;
  nextLaudoPsicologico?: string;
  
  // Dados do cônjuge
  spouseName?: string;
  spouseCpf?: string;
  spouseRg?: string;
  spouseBirthDate?: string;
  spouseProfession?: string;
  spousePhone?: string;
  spouseEmail?: string;
  
  // Campos da ficha de registro
  empresaNome?: string;
  empresaEndereco?: string;
  empresaCnpj?: string;
  tituloEleitor?: string;
  tituloEleitorDataExpedicao?: string;
  tituloEleitorValidade?: string;
  nomeConselhoRegional?: string;
  tituloEleitorZona?: string;
  tituloEleitorSecao?: string;
  carteiraIdentidadeOrgaoEmissor?: string;
  carteiraIdentidadeDataEmissao?: string;
  certificadoMilitar?: string;
  nomePai?: string;
  nomeMae?: string;
  localNascimento?: string;
  municipioNascimento?: string;
  estadoNascimento?: string;
  sexo?: string;
  grauInstrucao?: string;
  matriculaEsocial?: string;
  cbo?: string;
  salario?: number;
  salarioPorExtenso?: string;
  periodoPagamento?: string;
  horarioTrabalho?: string; // Período de Trabalho (ex: "18:00 ÀS 06:00 H")
  horarioTrabalhoIntervalo?: string; // Intervalo (ex: "23:00 ÀS 00:00 H")
  diasTrabalho?: string; // Dias de Trabalho (ex: "12X36")
  prazoExperienciaTexto?: string; // Prazo de Experiência em texto (ex: "45 DIAS")
  prorrogacaoExperiencia?: string; // Prorrogação do prazo de experiência
  folgaSemanal?: string; // Dias de Folga (ex: "1ª Escola")
  escalaTrabalho?: string; // Escala de Trabalho
  fgtsOptante?: boolean;
  fgtsDataOpcao?: string;
  fgtsBancoDepositario?: string;
  fgtsDataRetratacao?: string;
  pisDataCadastro?: string;
  pisBancoDepositario?: string;
  pisEnderecoBanco?: string;
  pisCodigoBanco?: string;
  pisCodigoAgencia?: string;
  cnhNumber?: string;
  cnhExpirationDate?: string;
  cnhCategory?: string;
  ctps?: string;
  ctpsRural?: string;
  ctpsSeries?: string;
  ctpsIssueDate?: string;
  ctpsIssuingAgency?: string;
  carteiraModelo19?: string;
  registroGeralEstrangeiro?: string;
  casadoBrasileiro?: boolean;
  nomeConjugeEstrangeiro?: string;
  temFilhosBrasileiros?: boolean;
  quantidadeFilhosBrasileiros?: number;
  dataChegadaBrasil?: string;
  naturalizado?: boolean;
  decretoNaturalizacao?: string;
  vistoFiscalizacao?: string;
  assinaturaFuncionario?: string;
  dataRescisao?: string;
  
  // Relacionamentos
  position?: { 
    id: string;
    name?: string;
    description?: string;
  };
  unit?: { 
    id: string;
    name?: string;
    description?: string;
  };
  user?: { id: string };
  company?: { 
    id: string;
    name?: string;
    sigla?: string;
    cnpj?: string;
  };
  
  // Campo para Posto de Trabalho
  workPostId?: string;
  
  // Campo para Departamento
  departmentId?: string;
  
  // Dados aninhados
  bankData?: EmployeeBankData;
  documents?: { type: string; number: string; file?: File }[];
  dependents?: Array<{
    name: string;
    relationship: string;
    birthDate: string;
    cpf?: string;
    rg?: string;
  }>;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
  id: string;
}