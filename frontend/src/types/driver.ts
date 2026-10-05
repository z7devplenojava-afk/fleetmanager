export interface Driver {
  id: string; // UUID
  name: string;
  status: 'ATIVO' | 'INATIVO';
  licenseNumber?: string;
  phone?: string; // WhatsApp do motorista
  cpf?: string;
  cnhCategory?: string; // A, B, C, D, E, ACC
  cnhExpiration?: string; // yyyy-MM-dd
  photoUrl?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Origem do registro: cadastro pr�prio de motorista ou funcion�rio com CNH
  source?: 'DRIVER' | 'EMPLOYEE';
  employeeId?: string;
}
