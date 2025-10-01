export interface Driver {
  id: string; // UUID
  name: string;
  status: 'ATIVO' | 'INATIVO';
  licenseNumber?: string;
  createdAt?: string;
  updatedAt?: string;
} 