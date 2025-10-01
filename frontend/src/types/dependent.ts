import { UUID } from './employee';

export interface Dependent {
  id: UUID;
  employee: {
    id: UUID;
    name?: string;
  };
  name: string;
  relationship: string;
  birthDate?: string;
  cpf: string;
  rg?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDependentDTO {
  employeeId: UUID;
  name: string;
  relationship: string;
  birthDate?: string;
  cpf: string;
  rg?: string;
}

export interface UpdateDependentDTO extends Partial<CreateDependentDTO> {
  id: UUID;
}

export const RELATIONSHIP_TYPES = {
  SPOUSE: 'Cônjuge',
  CHILD: 'Filho(a)',
  PARENT: 'Pai/Mãe',
  SIBLING: 'Irmão/Irmã',
  GRANDPARENT: 'Avô/Avó',
  GRANDCHILD: 'Neto(a)',
  OTHER: 'Outro'
};