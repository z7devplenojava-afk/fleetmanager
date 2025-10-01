export interface OrderOfServiceSST {
  id: string;
  title: string;
  description: string;
  status: string;
  responsible: string;
  issueDate: string;
  executionDate?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderOfServiceSSTDTO {
  title: string;
  description: string;
  status: string;
  responsible: string;
  issueDate: string;
  executionDate?: string;
  documentUrl?: string;
}

export interface UpdateOrderOfServiceSSTDTO extends Partial<CreateOrderOfServiceSSTDTO> {
  id: string;
}

export interface OrderOfServiceSSTFilters {
  status?: string;
  responsible?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
} 