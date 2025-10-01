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
  carteiraIdentidade?: string;
  grauInstrucao?: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cep?: string;
  ctps?: string;
  cbo?: string;
  pis?: string;
  salario?: number; // BigDecimal do backend
  fgtsOptante?: boolean;
  fgtsDataOpcao?: string;
  fgtsBancoDepositario?: string;
  empresaNome?: string;
  empresaEndereco?: string;
  empresaCnpj?: string;
  possuiWhatsapp?: boolean;
  caminhoPdf?: string;
  mesReferencia?: string;
  anoReferencia?: string;
  
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
  
  // Dados aninhados (opcionais)
  bankData?: EmployeeBankData;
  documents?: EmployeeDocument[];
  history?: EmployeeHistoryItem[];
  
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
  hireDate?: string;
  status?: string;
  notes?: string;
  
  // Campos adicionais
  tituloEleitor?: string;
  carteiraIdentidade?: string;
  grauInstrucao?: string;
  pai?: string;
  mae?: string;
  naturalidade?: string;
  cep?: string;
  ctps?: string;
  cbo?: string;
  pis?: string;
  salario?: number;
  fgtsOptante?: boolean;
  fgtsDataOpcao?: string;
  fgtsBancoDepositario?: string;
  empresaNome?: string;
  empresaEndereco?: string;
  empresaCnpj?: string;
  possuiWhatsapp?: boolean;
  
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
  
  // Dados aninhados
  bankData?: EmployeeBankData;
  documents?: { type: string; number: string; file?: File }[];
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
  id: string;
}