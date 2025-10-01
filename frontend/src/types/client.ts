import { UUID } from './employee';

export interface Client {
  id: UUID;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export interface ClientFormData {
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: ClientStatus;
  notes?: string;
}

export interface ClientSearchParams {
  searchTerm?: string;
  status?: ClientStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface ClientPage {
  content: Client[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}