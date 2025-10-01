export type EPIType = 'HELMET' | 'GLOVES' | 'SAFETY_GLASSES' | 'SAFETY_SHOES' | 'UNIFORM' | 'RESPIRATOR' | 'OTHER';
export type EPIStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'EXPIRED';
export type EPIAssignmentStatus = 'ASSIGNED' | 'RETURNED' | 'LOST' | 'DAMAGED';

export interface EPI {
  id: number;
  name: string;
  description?: string;
  type: EPIType;
  brand: string;
  model: string;
  size?: string;
  color?: string;
  certification: string;
  status: EPIStatus;
  quantity: number;
  availableQuantity: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
  expiryDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EPIAssignment {
  id: number;
  epiId: number;
  epiName: string;
  employeeId: number;
  employeeName: string;
  assignedDate: string;
  returnDate?: string;
  status: EPIAssignmentStatus;
  assignedBy: string;
  returnedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EPIStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  expired: number;
  totalValue: number;
  assigned: number;
  available: number;
  byType: Record<EPIType, number>;
}

export interface EPIFilters {
  type?: EPIType;
  status?: EPIStatus;
  supplier?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface EPIAssignmentFilters {
  epiId?: number;
  employeeId?: number;
  status?: EPIAssignmentStatus;
  dateFrom?: string;
  dateTo?: string;
} 