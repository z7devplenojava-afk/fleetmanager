export type UserRole = 'FLEX_ADMIN' | 'COMPANY_ADMIN' | 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'RH' | 'ASSISTENCIA_RH' | 'DEPARTAMENTO_PESSOAL' | 'FINANCEIRO' | 'OPERACIONAL' | 'VIGILANTE' | 'AUXI_ADMINISTRATIVO' | 'AUX_DEP' | 'TI_SUPORTE' | 'AUDITOR' | 'COLABORADOR' | 'MOTORISTA' | 'MECANICO' | 'PORTARIA' | 'GESTOR' | 'GESTOR_TRAFEGO';

export type UserGroup = 'GRUPO_SUPER_ADMIN' | 'GRUPO_ADMIN' | 'GRUPO_GESTOR' | 'GRUPO_RH' | 'GRUPO_DPE' | 'GRUPO_SUPERVISOR' | 'GRUPO_COLABORADORES' | 'GRUPO_OPERACIONAL' | 'GRUPO_VIGILANTES' | 'GRUPO_FINANCEIRO' | 'GRUPO_TI_SUPORTE' | 'GRUPO_AUDITOR' | 'GRUPO_AUXILIARES';

export interface UserPermissions {
  // Permissões de Usuários
  USERS_READ: boolean;
  USERS_WRITE: boolean;
  USERS_DELETE: boolean;
  USERS_CREATE: boolean;

  // Permissões de Grupos
  GROUPS_READ: boolean;
  GROUPS_WRITE: boolean;
  GROUPS_DELETE: boolean;
  GROUPS_CREATE: boolean;

  // Permissões de Clientes
  CLIENTS_READ: boolean;
  CLIENTS_WRITE: boolean;
  CLIENTS_DELETE: boolean;
  CLIENTS_CREATE: boolean;

  // Permissões de Funcionários
  EMPLOYEES_READ: boolean;
  EMPLOYEES_WRITE: boolean;
  EMPLOYEES_DELETE: boolean;
  EMPLOYEES_CREATE: boolean;

  // Permissões de Contratos
  CONTRACTS_READ: boolean;
  CONTRACTS_WRITE: boolean;
  CONTRACTS_DELETE: boolean;
  CONTRACTS_CREATE: boolean;

  // Permissões Financeiras
  FINANCIAL_READ: boolean;
  FINANCIAL_WRITE: boolean;
  FINANCIAL_DELETE: boolean;
  FINANCIAL_CREATE: boolean;

  // Permissões de Holerites
  PAYSLIPS_READ: boolean;
  PAYSLIPS_WRITE: boolean;
  PAYSLIPS_DELETE: boolean;
  PAYSLIPS_CREATE: boolean;
  PAYSLIPS_PUBLISH: boolean;

  // Permissões de Estoque
  STOCK_READ: boolean;
  STOCK_WRITE: boolean;
  STOCK_DELETE: boolean;
  STOCK_CREATE: boolean;
  STOCK_MANAGE: boolean;

  // Permissões de Equipamentos/Frota
  EQUIPMENTS_READ: boolean;
  EQUIPMENTS_WRITE: boolean;
  EQUIPMENTS_DELETE: boolean;
  EQUIPMENTS_CREATE: boolean;
  EQUIPMENTS_ASSIGN: boolean;

  // Permissões de Empresas
  COMPANIES_READ: boolean;
  COMPANIES_WRITE: boolean;
  COMPANIES_DELETE: boolean;
  COMPANIES_CREATE: boolean;
  COMPANIES_MANAGE: boolean;

  // Permissões de Relatórios
  REPORTS_READ: boolean;
  REPORTS_GENERATE: boolean;
  REPORTS_EXPORT: boolean;

  // Permissões do Módulo Comercial
  LEADS_READ: boolean;
  LEADS_WRITE: boolean;
  LEADS_DELETE: boolean;
  LEADS_CREATE: boolean;

  PROPOSALS_READ: boolean;
  PROPOSALS_WRITE: boolean;
  PROPOSALS_DELETE: boolean;
  PROPOSALS_CREATE: boolean;

  QUOTES_READ: boolean;
  QUOTES_WRITE: boolean;
  QUOTES_DELETE: boolean;
  QUOTES_CREATE: boolean;

  // Permissões de Sistema
  SYSTEM_CONFIG: boolean;
  SYSTEM_CONFIG_MANAGE: boolean;
  SYSTEM_LOGS: boolean;
  SYSTEM_BACKUP: boolean;
  SYSTEM_INTEGRATION: boolean;

  // Permissões de Auditoria
  AUDIT_READ: boolean;
  AUDIT_WRITE: boolean;

  // Permissões de Dashboard
  DASHBOARD_READ: boolean;
  DASHBOARD_WRITE: boolean;

  // Permissões de Perfil
  PROFILE_READ: boolean;
  PROFILE_WRITE: boolean;

  // Permissões de Suporte
  SUPPORT_READ: boolean;
  SUPPORT_WRITE: boolean;
  SUPPORT_DELETE: boolean;
  SUPPORT_CREATE: boolean;
  SUPPORT_MANAGE: boolean;

  // Permissões de Mensagens
  MESSAGES_READ: boolean;
  MESSAGES_WRITE: boolean;
  MESSAGES_DELETE: boolean;
  MESSAGES_CREATE: boolean;
  MESSAGES_MANAGE: boolean;

  // Permissões de Atendimento
  ATTENDANCE_READ: boolean;
  ATTENDANCE_WRITE: boolean;
  ATTENDANCE_MANAGE: boolean;

  // Permissões de Visitas
  VISITS_READ: boolean;
  VISITS_WRITE: boolean;
  VISITS_CREATE: boolean;
  VISITS_UPDATE: boolean;
  VISITS_DELETE: boolean;
  VISITS_MANAGE: boolean;

  // Permissões de Ponto Eletrônico
  TIME_RECORD_READ: boolean;
  TIME_RECORD_CREATE: boolean;
  TIME_RECORD_UPDATE: boolean;
  TIME_RECORD_DELETE: boolean;
  TIME_RECORD_MANAGE: boolean;

  // Permissões de Gestão de Tráfego
  TRAFFIC_MANAGEMENT_READ: boolean;
  TRAFFIC_MANAGEMENT_WRITE: boolean;
  TRAFFIC_MANAGEMENT_CREATE: boolean;
  TRAFFIC_MANAGEMENT_DELETE: boolean;

  TRIPS_READ: boolean;
  TRIPS_WRITE: boolean;
  TRIPS_EXECUTE: boolean;

  BOARDING_READ: boolean;
  BOARDING_EXECUTE: boolean;

  // Permissões de Folha de Pagamento
  PAYROLL_READ: boolean;
  PAYROLL_CREATE: boolean;
  PAYROLL_MANAGE: boolean;

  // Permissões de Rotas (Ticketing)
  ROUTES_READ: boolean;
  ROUTES_WRITE: boolean;
  ROUTES_CREATE: boolean;
  ROUTES_DELETE: boolean;

  // Permissão de Acesso Total
  ALL_PERMISSIONS: boolean;
}

export interface UserGroupData {
  id: string;
  groupName: UserGroup;
  displayName: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export type Role = { name: string };

export interface PermissionDTO {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles: Role[] | string[];
  groups: UserGroupData[];
  permissions: UserPermissions;
  isOnline?: boolean;
  individualPermissions?: PermissionDTO[];
  customPermissions?: string[]; // Permissões customizadas concedidas pelo SUPER_ADMIN (para COLABORADOR)
  avatar?: string;
  department?: string;
  position?: string;
  employeeCode?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  username?: string;
  status?: string;
  active?: boolean;
  firstAccessCompleted?: boolean; // Indica se o usuário completou o primeiro acesso (mudança de senha)
  createdAt?: string;
  updatedAt?: string;
}

/** Dados da empresa para exibição (logo, nome, tema) */
export interface EmpresaInfo {
  id: string;
  nome: string;
  logoUrl?: string;
  temaCor?: string;
  branchName?: string;
  unitName?: string;
  enabledFeatures?: string[]; // Funcionalidades habilitadas para esta empresa
}

export interface AuthContextType {
  user: User | null;
  empresa: EmpresaInfo | null;
  profile?: any;
  login: (email: string, password: string, companyId?: string) => Promise<void>;
  logout: () => void;
  signOut: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuthToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setFirstAccessCompleted: (completed: boolean) => void;
  hasRole: (role: UserRole | string) => boolean;
}

// Configurações de menu por role
export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  requiredPermission?: keyof UserPermissions;
  color?: string;
}

export const MENU_CONFIG: Partial<Record<UserRole, MenuItem[]>> = {
  SUPER_ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: 'BarChart3', color: '🟥' },
    { label: 'Usuários', path: '/usuarios', icon: 'Users', color: '🟥' },
    { label: 'Grupos', path: '/grupos', icon: 'Users', color: '🟥' },
    { label: 'Colaboradores', path: '/employees', icon: 'Users', color: '🟥' },
    { label: 'Clientes', path: '/clients', icon: 'Building', color: '🟥' },
    { label: 'Contratos', path: '/contracts', icon: 'FileContract', color: '🟥' },
    { label: 'Financeiro', path: '/financial', icon: 'DollarSign', color: '🟥' },
    { label: 'Holerites', path: '/payslips', icon: 'FileText', color: '🟥' },
    { label: 'Relatórios', path: '/reports', icon: 'PieChart', color: '🟥' },
    { label: 'Sistema', path: '/system', icon: 'Settings', color: '🟥' },
    { label: 'Auditoria', path: '/audit', icon: 'Shield', color: '🟥' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟥' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: 'BarChart3', color: '🟦' },
    { label: 'Usuários', path: '/usuarios', icon: 'Users', color: '🟦' },
    { label: 'Grupos', path: '/grupos', icon: 'Users', color: '🟦' },
    { label: 'Colaboradores', path: '/employees', icon: 'Users', color: '🟦' },
    { label: 'Clientes', path: '/clients', icon: 'Building', color: '🟦' },
    { label: 'Contratos', path: '/contracts', icon: 'FileContract', color: '🟦' },
    { label: 'Financeiro', path: '/financial', icon: 'DollarSign', color: '🟦' },
    { label: 'Holerites', path: '/payslips', icon: 'FileText', color: '🟦' },
    { label: 'Relatórios', path: '/reports', icon: 'PieChart', color: '🟦' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟦' },
  ],
  SUPERVISOR: [
    { label: 'Dashboard', path: '/dashboard', icon: 'BarChart3', color: '🟩' },
    { label: 'Minha Equipe', path: '/team', icon: 'Users', color: '🟩' },
    { label: 'Contratos', path: '/contracts', icon: 'FileContract', color: '🟩' },
    { label: 'Holerites', path: '/payslips', icon: 'FileText', color: '🟩' },
    { label: 'Relatórios', path: '/reports', icon: 'PieChart', color: '🟩' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟩' },
  ],
  RH: [
    { label: 'Dashboard', path: '/dashboard', icon: 'BarChart3', color: '🟨' },
    { label: 'Colaboradores', path: '/employees', icon: 'Users', color: '🟨' },
    { label: 'Holerites', path: '/payslips', icon: 'FileText', color: '🟨' },
    { label: 'Relatórios', path: '/reports', icon: 'PieChart', color: '🟨' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟨' },
  ],
  FINANCEIRO: [
    { label: 'Dashboard', path: '/dashboard', icon: 'BarChart3', color: '🟧' },
    { label: 'Financeiro', path: '/financial', icon: 'DollarSign', color: '🟧' },
    { label: 'Holerites', path: '/payslips', icon: 'FileText', color: '🟧' },
    { label: 'Relatórios', path: '/reports', icon: 'PieChart', color: '🟧' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟧' },
  ],
  TI_SUPORTE: [
    { label: 'Dashboard', path: '/dashboard', icon: 'BarChart3', color: '🟪' },
    { label: 'Usuários', path: '/usuarios', icon: 'Users', color: '🟪' },
    { label: 'Grupos', path: '/grupos', icon: 'Users', color: '🟪' },
    { label: 'Sistema', path: '/system', icon: 'Settings', color: '🟪' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟪' },
  ],
  AUDITOR: [
    { label: 'Dashboard', path: '/dashboard', icon: 'BarChart3', color: '🟫' },
    { label: 'Usuários', path: '/usuarios', icon: 'Users', color: '🟫' },
    { label: 'Colaboradores', path: '/employees', icon: 'Users', color: '🟫' },
    { label: 'Clientes', path: '/clients', icon: 'Building', color: '🟫' },
    { label: 'Contratos', path: '/contracts', icon: 'FileContract', color: '🟫' },
    { label: 'Financeiro', path: '/financial', icon: 'DollarSign', color: '🟫' },
    { label: 'Holerites', path: '/payslips', icon: 'FileText', color: '🟫' },
    { label: 'Relatórios', path: '/reports', icon: 'PieChart', color: '🟫' },
    { label: 'Auditoria', path: '/audit', icon: 'Shield', color: '🟫' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟫' },
  ],
  COLABORADOR: [
    { label: 'Meu Holerite', path: '/payslip', icon: 'FileText', color: '🟨' },
    { label: 'Meu Perfil', path: '/profile', icon: 'User', color: '🟨' },
    { label: 'Configurações', path: '/settings', icon: 'Settings', color: '🟨' },
  ],
};

export interface UserWithGroups extends User {
  groups: UserGroupData[];
  id: string;
}