export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: ItemCategory;
  type: ItemType;
  brand: string;
  model?: string;
  size?: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  minimumQuantity: number;
  location: string;
  supplier: string;
  supplierCode?: string;
  expiryDate?: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitPrice?: number;
  totalValue?: number;
  reason: string;
  responsiblePerson: string;
  movementDate: string;
  notes?: string;
  item?: InventoryItem;
}

export interface InventoryItemDTO {
  name: string;
  description?: string;
  category: ItemCategory;
  type: ItemType;
  brand: string;
  model?: string;
  size?: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  minimumQuantity: number;
  location: string;
  supplier: string;
  supplierCode?: string;
  expiryDate?: string;
  status: ItemStatus;
}

export interface InventoryMovementDTO {
  itemId: string;
  movementType: MovementType;
  quantity: number;
  reason: string;
  responsiblePerson: string;
  notes?: string;
}

export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
  recentMovements: number;
  categoryDistribution: CategoryDistribution[];
  monthlyMovements: MonthlyMovement[];
}

export interface CategoryDistribution {
  category: ItemCategory;
  count: number;
  totalValue: number;
}

export interface MonthlyMovement {
  month: string;
  entries: number;
  exits: number;
  totalValue: number;
}

export enum ItemCategory {
  UNIFORM = 'UNIFORM',
  EQUIPMENT = 'EQUIPMENT',
  TOOLS = 'TOOLS',
  SUPPLIES = 'SUPPLIES',
  ELECTRONICS = 'ELECTRONICS',
  SAFETY = 'SAFETY',
  OFFICE = 'OFFICE',
  OTHER = 'OTHER'
}

export enum ItemType {
  UNIFORM = 'UNIFORM',
  FOOTWEAR = 'FOOTWEAR',
  PROTECTIVE_EQUIPMENT = 'PROTECTIVE_EQUIPMENT',
  TOOL = 'TOOL',
  ELECTRONIC_DEVICE = 'ELECTRONIC_DEVICE',
  OFFICE_SUPPLY = 'OFFICE_SUPPLY',
  CLEANING_SUPPLY = 'CLEANING_SUPPLY',
  MAINTENANCE_SUPPLY = 'MAINTENANCE_SUPPLY',
  OTHER = 'OTHER'
}

export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  LOSS = 'LOSS',
  EXPIRATION = 'EXPIRATION'
}

export interface InventoryRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  items: InventoryRequestItem[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  completedAt?: string;
}

export interface InventoryRequestItem {
  id: string;
  itemId: string;
  itemDescription: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehiclePlate: string;
  items: ServiceOrderItem[];
  laborCost: number;
  partsCost: number;
  totalCost: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ServiceOrderItem {
  id: string;
  type: 'PART' | 'LABOR';
  description: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  appliedQuantity?: number;
  returnedQuantity?: number;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  entriesThisMonth: number;
  exitsThisMonth: number;
  pendingRequests: number;
}