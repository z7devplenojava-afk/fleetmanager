export interface StockItem {
  id: string;
  code: string;
  name: string;
  category: StockCategory;
  sizeVariation?: string;
  description?: string;
  currentQuantity: number;
  minimumQuantity: number;
  unitCost?: number;
  supplier?: string;
  barcode?: string;
  qrCode?: string;
  active: boolean;
  unitId?: string;
  unitName?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  isLowStock: boolean;
  fullName: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  stockItemName: string;
  stockItemCode: string;
  stockItemFullName: string;
  movementType: MovementType;
  reason: MovementReason;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  employeeId?: string;
  employeeName?: string;
  userId?: string;
  userName?: string;
  documentNumber?: string;
  supplier?: string;
  unitCost?: number;
  totalCost?: number;
  movementDate: string;
  notes?: string;
  qrCodeUsed?: string;
  unitId?: string;
  unitName?: string;
}

export interface StockAlert {
  id: string;
  stockItemId: string;
  stockItemName: string;
  stockItemCode: string;
  alertType: string;
  message: string;
  currentQuantity?: number;
  minimumQuantity?: number;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
  resolvedByUserName?: string;
  priority: number;
}

export enum StockCategory {
  UNIFORME_VIGILANCIA = 'UNIFORME_VIGILANCIA',
  UNIFORME_SERVICOS = 'UNIFORME_SERVICOS',
  UNIFORME_ADMINISTRATIVO = 'UNIFORME_ADMINISTRATIVO',
  UNIFORME_COZINHA = 'UNIFORME_COZINHA',
  EPI = 'EPI',
  ACESSORIOS = 'ACESSORIOS',
  CALCADOS = 'CALCADOS'
}

export enum MovementType {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA'
}

export enum MovementReason {
  // Entradas
  COMPRA = 'COMPRA',
  DEVOLUCAO = 'DEVOLUCAO',
  AJUSTE_ENTRADA = 'AJUSTE_ENTRADA',
  
  // Saídas
  ENTREGA_INICIAL = 'ENTREGA_INICIAL',
  REPOSICAO = 'REPOSICAO',
  TROCA = 'TROCA',
  DESCARTE = 'DESCARTE',
  PERDA = 'PERDA',
  AJUSTE_SAIDA = 'AJUSTE_SAIDA'
}

export interface CreateStockItemDTO {
  code: string;
  name: string;
  category: StockCategory;
  sizeVariation?: string;
  description?: string;
  currentQuantity?: number;
  minimumQuantity?: number;
  unitCost?: number;
  supplier?: string;
  barcode?: string;
  unitId?: string;
  notes?: string;
}

export interface CreateStockMovementDTO {
  stockItemId: string;
  movementType: MovementType;
  reason: MovementReason;
  quantity: number;
  employeeId?: string;
  documentNumber?: string;
  supplier?: string;
  unitCost?: number;
  notes?: string;
  qrCodeUsed?: string;
  unitId?: string;
}

export interface StockFilters {
  category?: StockCategory;
  active?: boolean;
  unitId?: string;
  lowStock?: boolean;
  searchTerm?: string;
}

export interface MovementFilters {
  stockItemId?: string;
  employeeId?: string;
  movementType?: MovementType;
  reason?: MovementReason;
  unitId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface StockReport {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  itemsByCategory: Record<string, number>;
  activeAlerts: number;
  criticalAlerts: number;
  lowStockItems: StockItem[];
  outOfStockItems: StockItem[];
}

// Labels para exibição
export const StockCategoryLabels: Record<StockCategory, string> = {
  [StockCategory.UNIFORME_VIGILANCIA]: 'Uniforme Vigilância',
  [StockCategory.UNIFORME_SERVICOS]: 'Uniforme Serviços',
  [StockCategory.UNIFORME_ADMINISTRATIVO]: 'Uniforme Administrativo',
  [StockCategory.UNIFORME_COZINHA]: 'Uniforme Cozinha',
  [StockCategory.EPI]: 'EPI',
  [StockCategory.ACESSORIOS]: 'Acessórios',
  [StockCategory.CALCADOS]: 'Calçados'
};

export const MovementTypeLabels: Record<MovementType, string> = {
  [MovementType.ENTRADA]: 'Entrada',
  [MovementType.SAIDA]: 'Saída'
};

export const MovementReasonLabels: Record<MovementReason, string> = {
  [MovementReason.COMPRA]: 'Compra/Fornecimento',
  [MovementReason.DEVOLUCAO]: 'Devolução',
  [MovementReason.AJUSTE_ENTRADA]: 'Ajuste de Estoque - Entrada',
  [MovementReason.ENTREGA_INICIAL]: 'Entrega Inicial',
  [MovementReason.REPOSICAO]: 'Reposição',
  [MovementReason.TROCA]: 'Troca',
  [MovementReason.DESCARTE]: 'Descarte',
  [MovementReason.PERDA]: 'Perda',
  [MovementReason.AJUSTE_SAIDA]: 'Ajuste de Estoque - Saída'
};