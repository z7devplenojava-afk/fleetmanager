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
  averageCost?: number;
  movementCount?: number;
  supplier?: string;
  invoiceNumber?: string;
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
  caNumber?: string;
  caValidity?: string;
  manufacturer?: string;
  epiId?: string;
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
  // Ônibus e Frota
  PECAS_MECANICA = 'PECAS_MECANICA',
  PECAS_ELETRICA = 'PECAS_ELETRICA',
  SISTEMA_FREIOS = 'SISTEMA_FREIOS',
  PNEUS_RODAS = 'PNEUS_RODAS',
  AR_CONDICIONADO = 'AR_CONDICIONADO',
  CARROCERIA_VIDROS = 'CARROCERIA_VIDROS',
  LUBRIFICANTES_FLUIDOS = 'LUBRIFICANTES_FLUIDOS',
  ACESSORIOS_ONIBUS = 'ACESSORIOS_ONIBUS',
  LIMPEZA_HIGIENIZACAO = 'LIMPEZA_HIGIENIZACAO',
  FERRAMENTAS = 'FERRAMENTAS',

  // Uniformes e EPIs
  UNIFORME_MOTORISTA = 'UNIFORME_MOTORISTA',
  UNIFORME_OFICINA = 'UNIFORME_OFICINA',
  UNIFORME_ADMINISTRATIVO = 'UNIFORME_ADMINISTRATIVO',
  EPI = 'EPI',
  CALCADOS = 'CALCADOS',

  // Empresa e Geral
  MATERIAL_ESCRITORIO = 'MATERIAL_ESCRITORIO',
  OUTROS = 'OUTROS',

  // Retrocompatibilidade
  UNIFORME_VIGILANCIA = 'UNIFORME_VIGILANCIA',
  UNIFORME_SERVICOS = 'UNIFORME_SERVICOS',
  UNIFORME_COZINHA = 'UNIFORME_COZINHA',
  ACESSORIOS = 'ACESSORIOS'
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
  averageCost?: number;
  supplier?: string;
  invoiceNumber?: string;
  barcode?: string;
  unitId?: string;
  notes?: string;
  caNumber?: string;
  caValidity?: string;
  manufacturer?: string;
  epiId?: string;
}

export interface ImportStockResult {
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
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
  // Ônibus e Frota
  [StockCategory.PECAS_MECANICA]: 'Peças Mecânicas / Motor / Câmbio',
  [StockCategory.PECAS_ELETRICA]: 'Elétrica e Baterias',
  [StockCategory.SISTEMA_FREIOS]: 'Freios e Suspensão',
  [StockCategory.PNEUS_RODAS]: 'Pneus, Câmaras e Rodas',
  [StockCategory.AR_CONDICIONADO]: 'Ar Condicionado e Refrigeração',
  [StockCategory.CARROCERIA_VIDROS]: 'Carroceria, Vidros e Funilaria',
  [StockCategory.LUBRIFICANTES_FLUIDOS]: 'Óleos, Lubrificantes e Fluidos',
  [StockCategory.ACESSORIOS_ONIBUS]: 'Acessórios de Ônibus (Bancos, Cortinas)',
  [StockCategory.LIMPEZA_HIGIENIZACAO]: 'Limpeza e Higienização de Veículos',
  [StockCategory.FERRAMENTAS]: 'Ferramentas e Equipamentos',

  // Uniformes e EPIs
  [StockCategory.UNIFORME_MOTORISTA]: 'Uniformes - Motoristas e Tráfego',
  [StockCategory.UNIFORME_OFICINA]: 'Uniformes - Oficina e Mecânica',
  [StockCategory.UNIFORME_ADMINISTRATIVO]: 'Uniformes - Administrativo',
  [StockCategory.EPI]: 'EPI (Equipamento de Proteção Individual)',
  [StockCategory.CALCADOS]: 'Calçados / Botinas',

  // Empresa e Geral
  [StockCategory.MATERIAL_ESCRITORIO]: 'Material de Escritório / TI',
  [StockCategory.OUTROS]: 'Outros',

  // Retrocompatibilidade
  [StockCategory.UNIFORME_VIGILANCIA]: 'Uniforme Vigilância',
  [StockCategory.UNIFORME_SERVICOS]: 'Uniforme Serviços',
  [StockCategory.UNIFORME_COZINHA]: 'Uniforme Cozinha',
  [StockCategory.ACESSORIOS]: 'Acessórios'
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