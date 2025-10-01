package br.com.fleetmanager.model.enums;

public enum Permission {
    // Permissões de Usuários
    USERS_READ,
    USERS_WRITE,
    USERS_DELETE,
    USERS_CREATE,
    
    // Permissões de Grupos
    GROUPS_READ,
    GROUPS_WRITE,
    GROUPS_DELETE,
    GROUPS_CREATE,
    
    // Permissões de Clientes
    CLIENTS_READ,
    CLIENTS_WRITE,
    CLIENTS_DELETE,
    CLIENTS_CREATE,
    
    // Permissões de Funcionários
    EMPLOYEES_READ,
    EMPLOYEES_WRITE,
    EMPLOYEES_DELETE,
    EMPLOYEES_CREATE,
    
    // Permissões de Contratos
    CONTRACTS_READ,
    CONTRACTS_WRITE,
    CONTRACTS_DELETE,
    CONTRACTS_CREATE,
    
    // Permissões Financeiras
    FINANCIAL_READ,
    FINANCIAL_WRITE,
    FINANCIAL_DELETE,
    FINANCIAL_CREATE,
    
    // Permissões de Holerites
    PAYSLIPS_READ,
    PAYSLIPS_WRITE,
    PAYSLIPS_DELETE,
    PAYSLIPS_CREATE,
    PAYSLIPS_PUBLISH,
    
    // Permissões de Relatórios
    REPORTS_READ,
    REPORTS_GENERATE,
    REPORTS_EXPORT,
    
    // Permissões do Módulo Comercial
    LEADS_READ,
    LEADS_WRITE,
    LEADS_DELETE,
    LEADS_CREATE,
    
    PROPOSALS_READ,
    PROPOSALS_WRITE,
    PROPOSALS_DELETE,
    PROPOSALS_CREATE,
    
    QUOTES_READ,
    QUOTES_WRITE,
    QUOTES_DELETE,
    QUOTES_CREATE,
    
    // Permissões de Equipamentos
    EQUIPMENTS_READ,
    EQUIPMENTS_WRITE,
    EQUIPMENTS_DELETE,
    EQUIPMENTS_CREATE,
    EQUIPMENTS_ASSIGN,
    
    // Permissões de Sistema
    SYSTEM_CONFIG,
    SYSTEM_LOGS,
    SYSTEM_BACKUP,
    SYSTEM_INTEGRATION,
    
    // Permissões de Auditoria
    AUDIT_READ,
    AUDIT_WRITE,
    
    // Permissões de Dashboard
    DASHBOARD_READ,
    DASHBOARD_WRITE,
    
    // Permissões de Perfil
    PROFILE_READ,
    PROFILE_WRITE,
    
    // Permissões de Mensagens e Comunicação Interna
    MESSAGES_READ,
    MESSAGES_WRITE,
    MESSAGES_CREATE,
    MESSAGES_DELETE,
    MESSAGES_MANAGE,
    
    // Permissões de Atendimento e Suporte
    SUPPORT_READ,
    SUPPORT_WRITE,
    SUPPORT_MANAGE,
    ATTENDANCE_READ,
    ATTENDANCE_WRITE,
    ATTENDANCE_MANAGE,
    
    // Permissão de Acesso Total
    ALL_PERMISSIONS
} 