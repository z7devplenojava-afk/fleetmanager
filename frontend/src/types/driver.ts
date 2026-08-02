export interface Driver {
  id: string; // UUID
  name: string;
  status: 'ATIVO' | 'INATIVO';
  licenseNumber?: string;
  phone?: string; // WhatsApp do motorista
  createdAt?: string;
  updatedAt?: string;
} 