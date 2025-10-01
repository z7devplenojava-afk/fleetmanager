import { UserRole, UserPermissions, UserGroupData } from '@/types/user';

// Função para gerar permissões baseadas no role principal
export const generatePermissions = (role: UserRole): UserPermissions => {
  const basePermissions: UserPermissions = {
    // Permissões de Usuários
    USERS_READ: false,
    USERS_WRITE: false,
    USERS_DELETE: false,
    USERS_CREATE: false,
    
    // Permissões de Grupos
    GROUPS_READ: false,
    GROUPS_WRITE: false,
    GROUPS_DELETE: false,
    GROUPS_CREATE: false,
    
    // Permissões de Clientes
    CLIENTS_READ: false,
    CLIENTS_WRITE: false,
    CLIENTS_DELETE: false,
    CLIENTS_CREATE: false,
    
    // Permissões de Funcionários
    EMPLOYEES_READ: false,
    EMPLOYEES_WRITE: false,
    EMPLOYEES_DELETE: false,
    EMPLOYEES_CREATE: false,
    
    // Permissões de Contratos
    CONTRACTS_READ: false,
    CONTRACTS_WRITE: false,
    CONTRACTS_DELETE: false,
    CONTRACTS_CREATE: false,
    
    // Permissões Financeiras
    FINANCIAL_READ: false,
    FINANCIAL_WRITE: false,
    FINANCIAL_DELETE: false,
    FINANCIAL_CREATE: false,
    
    // Permissões de Holerites
    PAYSLIPS_READ: false,
    PAYSLIPS_WRITE: false,
    PAYSLIPS_DELETE: false,
    PAYSLIPS_CREATE: false,
    PAYSLIPS_PUBLISH: false,
    
    // Permissões de Estoque
    STOCK_READ: false,
    STOCK_WRITE: false,
    STOCK_DELETE: false,
    STOCK_CREATE: false,
    STOCK_MANAGE: false,
    
    // Permissões de Equipamentos/Frota
    EQUIPMENTS_READ: false,
    EQUIPMENTS_WRITE: false,
    EQUIPMENTS_DELETE: false,
    EQUIPMENTS_CREATE: false,
    EQUIPMENTS_ASSIGN: false,
    
    // Permissões de Empresas
    COMPANIES_READ: false,
    COMPANIES_WRITE: false,
    COMPANIES_DELETE: false,
    COMPANIES_CREATE: false,
    COMPANIES_MANAGE: false,
    
    // Permissões de Relatórios
    REPORTS_READ: false,
    REPORTS_GENERATE: false,
    REPORTS_EXPORT: false,
    
    // Permissões do Módulo Comercial
    LEADS_READ: false,
    LEADS_WRITE: false,
    LEADS_DELETE: false,
    LEADS_CREATE: false,
    
    PROPOSALS_READ: false,
    PROPOSALS_WRITE: false,
    PROPOSALS_DELETE: false,
    PROPOSALS_CREATE: false,
    
    QUOTES_READ: false,
    QUOTES_WRITE: false,
    QUOTES_DELETE: false,
    QUOTES_CREATE: false,
    
    // Permissões de Sistema
    SYSTEM_CONFIG: false,
    SYSTEM_LOGS: false,
    SYSTEM_BACKUP: false,
    SYSTEM_INTEGRATION: false,
    
    // Permissões de Auditoria
    AUDIT_READ: false,
    AUDIT_WRITE: false,
    
    // Permissões de Dashboard
    DASHBOARD_READ: false,
    DASHBOARD_WRITE: false,
    
    // Permissões de Perfil
    PROFILE_READ: false,
    PROFILE_WRITE: false,
    
    // Permissões de Suporte
    SUPPORT_READ: false,
    SUPPORT_WRITE: false,
    SUPPORT_DELETE: false,
    SUPPORT_CREATE: false,
    SUPPORT_MANAGE: false,
    
    // Permissões de Mensagens
    MESSAGES_READ: false,
    MESSAGES_WRITE: false,
    MESSAGES_DELETE: false,
    MESSAGES_CREATE: false,
    MESSAGES_MANAGE: false,
    
    // Permissão de Acesso Total
    ALL_PERMISSIONS: false,
  };

  switch (role) {
    case 'SUPER_ADMIN':
      // Todas as permissões true para SUPER_ADMIN
      return Object.fromEntries(
        Object.keys(basePermissions).map(key => [key, true])
      ) as unknown as UserPermissions;

    case 'ADMIN':
      return {
        ...basePermissions,
        // Permissões de Usuários
        USERS_READ: true,
        USERS_WRITE: true,
        USERS_DELETE: true,
        USERS_CREATE: true,
        
        // Permissões de Grupos
        GROUPS_READ: true,
        GROUPS_WRITE: true,
        GROUPS_DELETE: true,
        GROUPS_CREATE: true,
        
        // Permissões de Clientes
        CLIENTS_READ: true,
        CLIENTS_WRITE: true,
        CLIENTS_DELETE: true,
        CLIENTS_CREATE: true,
        
        // Permissões de Funcionários
        EMPLOYEES_READ: true,
        EMPLOYEES_WRITE: true,
        EMPLOYEES_DELETE: true,
        EMPLOYEES_CREATE: true,
        
        // Permissões de Contratos
        CONTRACTS_READ: true,
        CONTRACTS_WRITE: true,
        CONTRACTS_DELETE: true,
        CONTRACTS_CREATE: true,
        
        // Permissões Financeiras
        FINANCIAL_READ: true,
        FINANCIAL_WRITE: true,
        FINANCIAL_DELETE: true,
        FINANCIAL_CREATE: true,
        
        // Permissões de Holerites
        PAYSLIPS_READ: true,
        PAYSLIPS_WRITE: true,
        PAYSLIPS_DELETE: true,
        PAYSLIPS_CREATE: true,
        PAYSLIPS_PUBLISH: true,
        
        // Permissões de Estoque
        STOCK_READ: true,
        STOCK_WRITE: true,
        STOCK_DELETE: true,
        STOCK_CREATE: true,
        STOCK_MANAGE: true,
        
        // Permissões de Equipamentos/Frota
        EQUIPMENTS_READ: true,
        EQUIPMENTS_WRITE: true,
        EQUIPMENTS_DELETE: true,
        EQUIPMENTS_CREATE: true,
        EQUIPMENTS_ASSIGN: true,
        
        // Permissões de Empresas
        COMPANIES_READ: true,
        COMPANIES_WRITE: true,
        COMPANIES_DELETE: true,
        COMPANIES_CREATE: true,
        COMPANIES_MANAGE: true,
        
        // Permissões de Relatórios
        REPORTS_READ: true,
        REPORTS_GENERATE: true,
        REPORTS_EXPORT: true,
        
        // Permissões do Módulo Comercial
        LEADS_READ: true,
        LEADS_WRITE: true,
        LEADS_DELETE: true,
        LEADS_CREATE: true,
        
        PROPOSALS_READ: true,
        PROPOSALS_WRITE: true,
        PROPOSALS_DELETE: true,
        PROPOSALS_CREATE: true,
        
        QUOTES_READ: true,
        QUOTES_WRITE: true,
        QUOTES_CREATE: true,
        
        // Permissões de Suporte
        SUPPORT_READ: true,
        SUPPORT_WRITE: true,
        SUPPORT_DELETE: true,
        SUPPORT_CREATE: true,
        SUPPORT_MANAGE: true,
        
        // Permissões de Mensagens
        MESSAGES_READ: true,
        MESSAGES_WRITE: true,
        MESSAGES_DELETE: true,
        MESSAGES_CREATE: true,
        MESSAGES_MANAGE: true,
        
        // Permissões de Atendimento
        ATTENDANCE_READ: true,
        ATTENDANCE_WRITE: true,
        ATTENDANCE_MANAGE: true,
      };

    case 'SUPERVISOR':
      return {
        ...basePermissions,
        EMPLOYEES_READ: true,
        EMPLOYEES_WRITE: true,
        CONTRACTS_READ: true,
        CONTRACTS_WRITE: true,
        PAYSLIPS_READ: true,
        PAYSLIPS_WRITE: true,
        REPORTS_READ: true,
        REPORTS_GENERATE: true,
        LEADS_READ: true,
        LEADS_WRITE: true,
        LEADS_CREATE: true,
        PROPOSALS_READ: true,
        PROPOSALS_WRITE: true,
        PROPOSALS_CREATE: true,
        QUOTES_READ: true,
        QUOTES_WRITE: true,
        QUOTES_CREATE: true,
        DASHBOARD_READ: true,
        PROFILE_READ: true,
        PROFILE_WRITE: true,
        
        // Permissões de Mensagens
        MESSAGES_READ: true,
        MESSAGES_WRITE: true,
        MESSAGES_CREATE: true,
        
        // Permissões de Suporte
        SUPPORT_READ: true,
        
        // Permissões de Equipamentos/Frota
        EQUIPMENTS_READ: true,
        EQUIPMENTS_WRITE: true,
      };

    case 'RH':
      return {
        ...basePermissions,
        EMPLOYEES_READ: true,
        EMPLOYEES_WRITE: true,
        EMPLOYEES_CREATE: true,
        EMPLOYEES_DELETE: true,
        PAYSLIPS_READ: true,
        PAYSLIPS_WRITE: true,
        PAYSLIPS_CREATE: true,
        PAYSLIPS_PUBLISH: true,
        REPORTS_READ: true,
        REPORTS_GENERATE: true,
        LEADS_READ: true,
        LEADS_WRITE: true,
        LEADS_CREATE: true,
        PROPOSALS_READ: true,
        PROPOSALS_WRITE: true,
        PROPOSALS_CREATE: true,
        QUOTES_READ: true,
        QUOTES_WRITE: true,
        QUOTES_CREATE: true,
        DASHBOARD_READ: true,
        PROFILE_READ: true,
        PROFILE_WRITE: true,
        
        // Permissões de Mensagens
        MESSAGES_READ: true,
        MESSAGES_WRITE: true,
        MESSAGES_CREATE: true,
        
        // Permissões de Suporte
        SUPPORT_READ: true,
      };

    case 'FINANCEIRO':
      return {
        ...basePermissions,
        FINANCIAL_READ: true,
        FINANCIAL_WRITE: true,
        FINANCIAL_CREATE: true,
        FINANCIAL_DELETE: true,
        PAYSLIPS_READ: true,
        PAYSLIPS_WRITE: true,
        REPORTS_READ: true,
        REPORTS_GENERATE: true,
        REPORTS_EXPORT: true,
        LEADS_READ: true,
        LEADS_WRITE: true,
        LEADS_CREATE: true,
        PROPOSALS_READ: true,
        PROPOSALS_WRITE: true,
        PROPOSALS_CREATE: true,
        QUOTES_READ: true,
        QUOTES_WRITE: true,
        QUOTES_CREATE: true,
        DASHBOARD_READ: true,
        PROFILE_READ: true,
        PROFILE_WRITE: true,
      };

    case 'TI_SUPORTE':
      return {
        ...basePermissions,
        SYSTEM_CONFIG: true,
        SYSTEM_LOGS: true,
        SYSTEM_BACKUP: true,
        SYSTEM_INTEGRATION: true,
        USERS_READ: true,
        USERS_WRITE: true,
        GROUPS_READ: true,
        GROUPS_WRITE: true,
        DASHBOARD_READ: true,
        PROFILE_READ: true,
        PROFILE_WRITE: true,
        
        // Permissões de Mensagens
        MESSAGES_READ: true,
        MESSAGES_WRITE: true,
        MESSAGES_CREATE: true,
        MESSAGES_DELETE: true,
        MESSAGES_MANAGE: true,
        
        // Permissões de Suporte
        SUPPORT_READ: true,
        SUPPORT_WRITE: true,
        SUPPORT_DELETE: true,
        SUPPORT_CREATE: true,
        SUPPORT_MANAGE: true,
      };

    case 'AUDITOR':
      return {
        ...basePermissions,
        USERS_READ: true,
        CLIENTS_READ: true,
        EMPLOYEES_READ: true,
        CONTRACTS_READ: true,
        FINANCIAL_READ: true,
        PAYSLIPS_READ: true,
        REPORTS_READ: true,
        LEADS_READ: true,
        PROPOSALS_READ: true,
        QUOTES_READ: true,
        DASHBOARD_READ: true,
        AUDIT_READ: true,
        PROFILE_READ: true,
        
        // Permissões de Mensagens
        MESSAGES_READ: true,
        
        // Permissões de Suporte
        SUPPORT_READ: true,
      };

    case 'COLABORADOR':
      return {
        ...basePermissions,
        PROFILE_READ: true,
        PROFILE_WRITE: true,
        PAYSLIPS_READ: true,
        REPORTS_READ: true,
        LEADS_READ: true,
        LEADS_WRITE: true,
        LEADS_CREATE: true,
        PROPOSALS_READ: true,
        PROPOSALS_WRITE: true,
        PROPOSALS_CREATE: true,
        QUOTES_READ: true,
        QUOTES_WRITE: true,
        QUOTES_CREATE: true,
        
        // Permissões de Mensagens
        MESSAGES_READ: true,
        MESSAGES_WRITE: true,
        MESSAGES_CREATE: true,
      };

    case 'GESTOR':
      return {
        ...basePermissions,
        // Permissões de Equipamentos/Frota
        EQUIPMENTS_READ: true,
        EQUIPMENTS_WRITE: true,
        EQUIPMENTS_CREATE: true,
        EQUIPMENTS_ASSIGN: true,
        
        // Permissões de Funcionários
        EMPLOYEES_READ: true,
        EMPLOYEES_WRITE: true,
        
        // Permissões de Contratos
        CONTRACTS_READ: true,
        CONTRACTS_WRITE: true,
        
        // Permissões de Relatórios
        REPORTS_READ: true,
        REPORTS_GENERATE: true,
        
        // Permissões de Dashboard
        DASHBOARD_READ: true,
        PROFILE_READ: true,
        PROFILE_WRITE: true,
      };

    default:
      return basePermissions;
  }
};

// Função para gerar permissões baseadas em grupos
export const generatePermissionsFromGroups = (groups: UserGroupData[]): UserPermissions => {
  const basePermissions: UserPermissions = {
    // Permissões de Usuários
    USERS_READ: false,
    USERS_WRITE: false,
    USERS_DELETE: false,
    USERS_CREATE: false,
    
    // Permissões de Grupos
    GROUPS_READ: false,
    GROUPS_WRITE: false,
    GROUPS_DELETE: false,
    GROUPS_CREATE: false,
    
    // Permissões de Clientes
    CLIENTS_READ: false,
    CLIENTS_WRITE: false,
    CLIENTS_DELETE: false,
    CLIENTS_CREATE: false,
    
    // Permissões de Funcionários
    EMPLOYEES_READ: false,
    EMPLOYEES_WRITE: false,
    EMPLOYEES_DELETE: false,
    EMPLOYEES_CREATE: false,
    
    // Permissões de Contratos
    CONTRACTS_READ: false,
    CONTRACTS_WRITE: false,
    CONTRACTS_DELETE: false,
    CONTRACTS_CREATE: false,
    
    // Permissões Financeiras
    FINANCIAL_READ: false,
    FINANCIAL_WRITE: false,
    FINANCIAL_DELETE: false,
    FINANCIAL_CREATE: false,
    
    // Permissões de Holerites
    PAYSLIPS_READ: false,
    PAYSLIPS_WRITE: false,
    PAYSLIPS_DELETE: false,
    PAYSLIPS_CREATE: false,
    PAYSLIPS_PUBLISH: false,
    
    // Permissões de Estoque
    STOCK_READ: false,
    STOCK_WRITE: false,
    STOCK_DELETE: false,
    STOCK_CREATE: false,
    STOCK_MANAGE: false,
    
    // Permissões de Equipamentos/Frota
    EQUIPMENTS_READ: false,
    EQUIPMENTS_WRITE: false,
    EQUIPMENTS_DELETE: false,
    EQUIPMENTS_CREATE: false,
    EQUIPMENTS_ASSIGN: false,
    
    // Permissões de Empresas
    COMPANIES_READ: false,
    COMPANIES_WRITE: false,
    COMPANIES_DELETE: false,
    COMPANIES_CREATE: false,
    COMPANIES_MANAGE: false,
    
    // Permissões de Relatórios
    REPORTS_READ: false,
    REPORTS_GENERATE: false,
    REPORTS_EXPORT: false,
    
    // Permissões do Módulo Comercial
    LEADS_READ: false,
    LEADS_WRITE: false,
    LEADS_DELETE: false,
    LEADS_CREATE: false,
    
    PROPOSALS_READ: false,
    PROPOSALS_WRITE: false,
    PROPOSALS_DELETE: false,
    PROPOSALS_CREATE: false,
    
    QUOTES_READ: false,
    QUOTES_WRITE: false,
    QUOTES_DELETE: false,
    QUOTES_CREATE: false,
    
    // Permissões de Sistema
    SYSTEM_CONFIG: false,
    SYSTEM_LOGS: false,
    SYSTEM_BACKUP: false,
    SYSTEM_INTEGRATION: false,
    
    // Permissões de Auditoria
    AUDIT_READ: false,
    AUDIT_WRITE: false,
    
    // Permissões de Dashboard
    DASHBOARD_READ: false,
    DASHBOARD_WRITE: false,
    
    // Permissões de Perfil
    PROFILE_READ: false,
    PROFILE_WRITE: false,
    
    // Permissões de Suporte
    SUPPORT_READ: false,
    SUPPORT_WRITE: false,
    SUPPORT_DELETE: false,
    SUPPORT_CREATE: false,
    SUPPORT_MANAGE: false,
    
    // Permissões de Mensagens
    MESSAGES_READ: false,
    MESSAGES_WRITE: false,
    MESSAGES_DELETE: false,
    MESSAGES_CREATE: false,
    MESSAGES_MANAGE: false,
    
    // Permissão de Acesso Total
    ALL_PERMISSIONS: false,
  };

  // Mapear permissões de string para propriedades do objeto
  const permissionMap: Record<string, keyof UserPermissions> = {
    'USERS_READ': 'USERS_READ',
    'USERS_WRITE': 'USERS_WRITE',
    'USERS_DELETE': 'USERS_DELETE',
    'USERS_CREATE': 'USERS_CREATE',
    'GROUPS_READ': 'GROUPS_READ',
    'GROUPS_WRITE': 'GROUPS_WRITE',
    'GROUPS_DELETE': 'GROUPS_DELETE',
    'GROUPS_CREATE': 'GROUPS_CREATE',
    'CLIENTS_READ': 'CLIENTS_READ',
    'CLIENTS_WRITE': 'CLIENTS_WRITE',
    'CLIENTS_DELETE': 'CLIENTS_DELETE',
    'CLIENTS_CREATE': 'CLIENTS_CREATE',
    'EMPLOYEES_READ': 'EMPLOYEES_READ',
    'EMPLOYEES_WRITE': 'EMPLOYEES_WRITE',
    'EMPLOYEES_DELETE': 'EMPLOYEES_DELETE',
    'EMPLOYEES_CREATE': 'EMPLOYEES_CREATE',
    'CONTRACTS_READ': 'CONTRACTS_READ',
    'CONTRACTS_WRITE': 'CONTRACTS_WRITE',
    'CONTRACTS_DELETE': 'CONTRACTS_DELETE',
    'CONTRACTS_CREATE': 'CONTRACTS_CREATE',
    'FINANCIAL_READ': 'FINANCIAL_READ',
    'FINANCIAL_WRITE': 'FINANCIAL_WRITE',
    'FINANCIAL_DELETE': 'FINANCIAL_DELETE',
    'FINANCIAL_CREATE': 'FINANCIAL_CREATE',
    'PAYSLIPS_READ': 'PAYSLIPS_READ',
    'PAYSLIPS_WRITE': 'PAYSLIPS_WRITE',
    'PAYSLIPS_DELETE': 'PAYSLIPS_DELETE',
    'PAYSLIPS_CREATE': 'PAYSLIPS_CREATE',
    'PAYSLIPS_PUBLISH': 'PAYSLIPS_PUBLISH',
    'STOCK_READ': 'STOCK_READ',
    'STOCK_WRITE': 'STOCK_WRITE',
    'STOCK_DELETE': 'STOCK_DELETE',
    'STOCK_CREATE': 'STOCK_CREATE',
    'STOCK_MANAGE': 'STOCK_MANAGE',
    'COMPANIES_READ': 'COMPANIES_READ',
    'COMPANIES_WRITE': 'COMPANIES_WRITE',
    'COMPANIES_DELETE': 'COMPANIES_DELETE',
    'COMPANIES_CREATE': 'COMPANIES_CREATE',
    'COMPANIES_MANAGE': 'COMPANIES_MANAGE',
    'REPORTS_READ': 'REPORTS_READ',
    'REPORTS_GENERATE': 'REPORTS_GENERATE',
    'REPORTS_EXPORT': 'REPORTS_EXPORT',
    'LEADS_READ': 'LEADS_READ',
    'LEADS_WRITE': 'LEADS_WRITE',
    'LEADS_DELETE': 'LEADS_DELETE',
    'LEADS_CREATE': 'LEADS_CREATE',
    'PROPOSALS_READ': 'PROPOSALS_READ',
    'PROPOSALS_WRITE': 'PROPOSALS_WRITE',
    'PROPOSALS_DELETE': 'PROPOSALS_DELETE',
    'PROPOSALS_CREATE': 'PROPOSALS_CREATE',
    'QUOTES_READ': 'QUOTES_READ',
    'QUOTES_WRITE': 'QUOTES_WRITE',
    'QUOTES_DELETE': 'QUOTES_DELETE',
    'QUOTES_CREATE': 'QUOTES_CREATE',
    'SYSTEM_CONFIG': 'SYSTEM_CONFIG',
    'SYSTEM_LOGS': 'SYSTEM_LOGS',
    'SYSTEM_BACKUP': 'SYSTEM_BACKUP',
    'SYSTEM_INTEGRATION': 'SYSTEM_INTEGRATION',
    'AUDIT_READ': 'AUDIT_READ',
    'AUDIT_WRITE': 'AUDIT_WRITE',
    'DASHBOARD_READ': 'DASHBOARD_READ',
    'DASHBOARD_WRITE': 'DASHBOARD_WRITE',
    'PROFILE_READ': 'PROFILE_READ',
    'PROFILE_WRITE': 'PROFILE_WRITE',
    'SUPPORT_READ': 'SUPPORT_READ',
    'SUPPORT_WRITE': 'SUPPORT_WRITE',
    'SUPPORT_DELETE': 'SUPPORT_DELETE',
    'SUPPORT_CREATE': 'SUPPORT_CREATE',
    'SUPPORT_MANAGE': 'SUPPORT_MANAGE',
    'MESSAGES_READ': 'MESSAGES_READ',
    'MESSAGES_WRITE': 'MESSAGES_WRITE',
    'MESSAGES_DELETE': 'MESSAGES_DELETE',
    'MESSAGES_CREATE': 'MESSAGES_CREATE',
    'MESSAGES_MANAGE': 'MESSAGES_MANAGE',
    'ALL_PERMISSIONS': 'ALL_PERMISSIONS',
  };

  // Aplicar permissões de todos os grupos
  for (const group of groups) {
    for (const permission of group.permissions) {
      const permissionKey = permissionMap[permission];
      if (permissionKey) {
        (basePermissions as any)[permissionKey] = true;
      }
    }
  }

  return basePermissions;
};

// Função para combinar permissões de role e grupos
export const combinePermissions = (rolePermissions: UserPermissions, groupPermissions: UserPermissions): UserPermissions => {
  const combined: UserPermissions = { ...rolePermissions };
  
  // Se qualquer uma das permissões (role ou grupo) for true, a permissão final será true
  Object.keys(rolePermissions).forEach(key => {
    const permissionKey = key as keyof UserPermissions;
    combined[permissionKey] = rolePermissions[permissionKey] || groupPermissions[permissionKey];
  });
  
  return combined;
};

// Função para verificar se usuário tem permissão específica
export const hasPermission = (
  userPermissions: UserPermissions | null,
  permission: keyof UserPermissions
): boolean => {
  if (!userPermissions) {
    console.log('🔍 hasPermission - userPermissions é null');
    return false;
  }
  
  // Se ALL_PERMISSIONS for true, retorna true para qualquer permissão
  if (userPermissions.ALL_PERMISSIONS) {
    console.log('🔍 hasPermission - ALL_PERMISSIONS é true, retornando true');
    return true;
  }
  
  const hasSpecificPermission = userPermissions[permission] || false;
  console.log(`🔍 hasPermission - ${permission}: ${hasSpecificPermission}`);
  return hasSpecificPermission;
};

// Função para verificar se usuário tem qualquer uma das permissões
export const hasAnyPermission = (
  userPermissions: UserPermissions | null,
  permissions: (keyof UserPermissions)[]
): boolean => {
  if (!userPermissions) return false;
  return permissions.some(permission => userPermissions[permission]);
};

// Função para verificar se usuário tem todas as permissões
export const hasAllPermissions = (
  userPermissions: UserPermissions | null,
  permissions: (keyof UserPermissions)[]
): boolean => {
  if (!userPermissions) return false;
  return permissions.every(permission => userPermissions[permission]);
};

// Função para obter o nome amigável do role
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    RH: 'Recursos Humanos',
    FINANCEIRO: 'Financeiro',
    TI_SUPORTE: 'TI / Suporte Técnico',
    AUDITOR: 'Auditor / Consultor',
    COLABORADOR: 'Colaborador',
    GESTOR: 'Gestor',
  };
  return roleNames[role] || role;
};

// Função para obter a cor do role (para badges, etc.)
export const getRoleColor = (role: UserRole): string => {
  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    SUPERVISOR: 'bg-green-100 text-green-800',
    RH: 'bg-yellow-100 text-yellow-800',
    FINANCEIRO: 'bg-orange-100 text-orange-800',
    TI_SUPORTE: 'bg-purple-100 text-purple-800',
    AUDITOR: 'bg-gray-100 text-gray-800',
    COLABORADOR: 'bg-indigo-100 text-indigo-800',
    GESTOR: 'bg-teal-100 text-teal-800',
  };
  return roleColors[role] || 'bg-gray-100 text-gray-800';
};

// Função para obter o nome amigável do grupo
export const getGroupDisplayName = (groupName: string): string => {
  const groupNames: Record<string, string> = {
    'GRUPO_SUPER_ADMIN': 'Super Administrador',
    'GRUPO_ADMIN': 'Administrador',
    'GRUPO_GESTOR': 'Gestor',
    'GRUPO_RH': 'Recursos Humanos',
    'GRUPO_DPE': 'Departamento Pessoal',
    'GRUPO_SUPERVISOR': 'Supervisor',
    'GRUPO_COLABORADORES': 'Colaboradores',
    'GRUPO_VIGILANTES': 'Vigilantes',
  };
  return groupNames[groupName] || groupName;
};

// Função para obter a cor do grupo (para badges, etc.)
export const getGroupColor = (groupName: string): string => {
  const groupColors: Record<string, string> = {
    'GRUPO_SUPER_ADMIN': 'bg-red-100 text-red-800',
    'GRUPO_ADMIN': 'bg-orange-100 text-orange-800',
    'GRUPO_GESTOR': 'bg-yellow-100 text-yellow-800',
    'GRUPO_RH': 'bg-purple-100 text-purple-800',
    'GRUPO_DPE': 'bg-teal-100 text-teal-800',
    'GRUPO_SUPERVISOR': 'bg-green-100 text-green-800',
    'GRUPO_COLABORADORES': 'bg-blue-100 text-blue-800',
    'GRUPO_VIGILANTES': 'bg-gray-100 text-gray-800',
  };
  return groupColors[groupName] || 'bg-gray-100 text-gray-800';
};