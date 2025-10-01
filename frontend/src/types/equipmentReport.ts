import { Equipment, EquipmentStatus, EquipmentUsage } from './equipment';
import { EquipmentMovement } from './equipmentMovement';

export interface EquipmentReportFilters {
  // Filtros básicos
  searchTerm?: string;
  status?: EquipmentStatus;
  protectionLevel?: string;
  usage?: EquipmentUsage;
  size?: string;
  isDangerous?: boolean;
  
  // Filtros de funcionário
  employeeId?: string;
  employeeName?: string;
  employeeCpf?: string;
  
  // Filtros de posto de trabalho
  workPostId?: string;
  workPostName?: string;
  
  // Filtros de datas
  manufacturingDateFrom?: string;
  manufacturingDateTo?: string;
  validityDateFrom?: string;
  validityDateTo?: string;
  sixYearExpiryFrom?: string;
  sixYearExpiryTo?: string;
  weaponRegistrationValidityFrom?: string;
  weaponRegistrationValidityTo?: string;
  
  // Filtros de expiração
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  daysToExpiry?: number;
  isWeaponRegistrationExpired?: boolean;
  isWeaponRegistrationExpiringSoon?: boolean;
  daysToWeaponRegistrationExpiry?: number;
  
  // Filtros de movimentação
  currentUserId?: string;
  hasActiveMovement?: boolean;
  isOverdue?: boolean;
  authorizedById?: string;
  
  // Filtros de lote e fabricação
  batch?: string;
  model?: string;
  serialNumber?: string;
  caNumber?: string;
  
  // Filtros de relatório
  reportType?: 'equipment_by_employee' | 'weapon_validity' | 'usage_report' | 'expiry_report' | 'general';
  exportFormat?: 'pdf' | 'excel';
  includeHistory?: boolean;
  includeMovements?: boolean;
  
  // Paginação
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface EquipmentReport {
  // Informações do relatório
  reportTitle: string;
  reportType: string;
  generatedAt: string;
  generatedBy: string;
  filtersApplied: string;
  
  // Estatísticas gerais
  totalEquipments: number;
  activeEquipments: number;
  expiredEquipments: number;
  expiringSoonEquipments: number;
  dangerousEquipments: number;
  weaponsWithExpiredRegistration: number;
  weaponsExpiringSoon: number;
  
  // Dados do relatório
  equipments?: Equipment[];
  movements?: EquipmentMovement[];
  
  // Relatórios específicos
  equipmentByEmployee?: EquipmentByEmployee[];
  weaponValidity?: WeaponValidity[];
  equipmentUsage?: EquipmentUsageReport[];
  equipmentExpiry?: EquipmentExpiry[];
  
  // Resumo por categoria
  categorySummary?: EquipmentCategorySummary[];
}

export interface EquipmentByEmployee {
  employeeId: string;
  employeeName: string;
  employeeCpf?: string;
  workPostId?: string;
  workPostName?: string;
  workPostLocation?: string;
  totalEquipments: number;
  activeEquipments: number;
  expiredEquipments: number;
  equipments: Equipment[];
  movements: EquipmentMovement[];
}

export interface WeaponValidity {
  equipmentId: string;
  serialNumber: string;
  model?: string;
  caNumber?: string;
  weaponRegistrationValidity?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysToExpiry?: number;
  currentUserName?: string;
  currentUserCpf?: string;
  workPostName?: string;
  workPostLocation?: string;
  lastMovement?: EquipmentMovement;
}

export interface EquipmentUsageReport {
  equipmentId: string;
  serialNumber: string;
  model?: string;
  status: EquipmentStatus;
  usage?: EquipmentUsage;
  totalMovements: number;
  activeMovements: number;
  daysInUse: number;
  mostUsedBy?: string;
  mostUsedAt?: string;
  lastMovementDate?: string;
  currentUserName?: string;
  currentUserCpf?: string;
}

export interface EquipmentExpiry {
  equipmentId: string;
  serialNumber: string;
  model?: string;
  validityDate?: string;
  sixYearExpiry?: string;
  weaponRegistrationValidity?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysToExpiry?: number;
  isWeaponRegistrationExpired: boolean;
  isWeaponRegistrationExpiringSoon: boolean;
  daysToWeaponRegistrationExpiry?: number;
  currentUserName?: string;
  currentUserCpf?: string;
  workPostName?: string;
  workPostLocation?: string;
}

export interface EquipmentCategorySummary {
  category: string; // "Weapons", "Vests", "Other"
  totalCount: number;
  activeCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  inMaintenanceCount: number;
  inStockCount: number;
  averageAgeInDays: number;
  mostCommonModel?: string;
  mostCommonProtectionLevel?: string;
}

export const REPORT_TYPES = {
  EQUIPMENT_BY_EMPLOYEE: 'equipment_by_employee',
  WEAPON_VALIDITY: 'weapon_validity',
  USAGE_REPORT: 'usage_report',
  EXPIRY_REPORT: 'expiry_report',
  GENERAL: 'general'
} as const;

export const REPORT_TYPE_LABELS = {
  [REPORT_TYPES.EQUIPMENT_BY_EMPLOYEE]: 'Equipamentos por Funcionário',
  [REPORT_TYPES.WEAPON_VALIDITY]: 'Validade de Armas',
  [REPORT_TYPES.USAGE_REPORT]: 'Relatório de Uso',
  [REPORT_TYPES.EXPIRY_REPORT]: 'Relatório de Vencimento',
  [REPORT_TYPES.GENERAL]: 'Relatório Geral'
} as const; 