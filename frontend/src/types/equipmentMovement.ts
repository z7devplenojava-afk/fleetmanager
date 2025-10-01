export enum MovementType {
  WITHDRAWAL = 'WITHDRAWAL',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
  MAINTENANCE = 'MAINTENANCE',
  INSPECTION = 'INSPECTION',
  TEMPORARY_USE = 'TEMPORARY_USE',
  PERMANENT_ASSIGNMENT = 'PERMANENT_ASSIGNMENT'
}

export interface EquipmentMovement {
  id: string;
  equipmentId: string;
  equipmentSerialNumber: string;
  equipmentModel?: string;
  employeeId: string;
  employeeName: string;
  employeeCpf?: string;
  workPostId?: string;
  workPostName?: string;
  workPostLocation?: string;
  authorizedById: string;
  authorizedByName: string;
  movementType: MovementType;
  movementDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  reason?: string;
  notes?: string;
  returned: boolean;
  conditionOnWithdrawal?: string;
  conditionOnReturn?: string;
  createdAt: string;
  
  // Campos calculados
  isOverdue: boolean;
  daysOut: number;
  status: string;
}

export interface CreateEquipmentMovementRequest {
  equipmentId: string;
  employeeId: string;
  workPostId?: string;
  authorizedById: string;
  movementType: MovementType;
  movementDate: string;
  expectedReturnDate?: string;
  reason?: string;
  notes?: string;
  conditionOnWithdrawal?: string;
}

export const MOVEMENT_TYPE_LABELS = {
  [MovementType.WITHDRAWAL]: 'Retirada',
  [MovementType.RETURN]: 'Devolução',
  [MovementType.TRANSFER]: 'Transferência',
  [MovementType.MAINTENANCE]: 'Manutenção',
  [MovementType.INSPECTION]: 'Inspeção',
  [MovementType.TEMPORARY_USE]: 'Uso Temporário',
  [MovementType.PERMANENT_ASSIGNMENT]: 'Atribuição Permanente'
}; 