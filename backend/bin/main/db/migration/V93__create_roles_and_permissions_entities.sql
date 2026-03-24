-- Migration: V237__create_roles_and_permissions_entities.sql
-- Description: Update roles and permissions tables to support JPA entities
-- Note: Tables already exist from V5__create_hr_additional_tables.sql
-- Data already exists from V234__create_roles_and_permissions.sql

-- Update permissions table structure to match JPA entity
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS description VARCHAR(255);

-- Update roles table structure to match JPA entity  
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS description VARCHAR(255);

-- Add missing permissions that are needed for the JPA entities
-- Only insert permissions that don't already exist
INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'MANAGE_FLEET', 
    'Gerenciar frota'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'MANAGE_FLEET');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_FLEET', 
    'Visualizar frota'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_FLEET');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'FINANCIAL_READ', 
    'Visualizar dados financeiros'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'FINANCIAL_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'FINANCIAL_CREATE', 
    'Criar dados financeiros'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'FINANCIAL_CREATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'FINANCIAL_WRITE', 
    'Editar dados financeiros'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'FINANCIAL_WRITE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'FINANCIAL_DELETE', 
    'Excluir dados financeiros'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'FINANCIAL_DELETE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PAYSLIPS_READ', 
    'Visualizar holerites'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PAYSLIPS_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PAYSLIPS_CREATE', 
    'Criar holerites'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PAYSLIPS_CREATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PAYSLIPS_WRITE', 
    'Editar holerites'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PAYSLIPS_WRITE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PAYSLIPS_DELETE', 
    'Excluir holerites'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PAYSLIPS_DELETE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_PAYSLIP', 
    'Visualizar holerite'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_PAYSLIP');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'DOWNLOAD_PAYSLIP', 
    'Baixar holerite'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'DOWNLOAD_PAYSLIP');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'EDIT_PROFILE', 
    'Editar perfil'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'EDIT_PROFILE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_EMPLOYEES', 
    'Visualizar funcionários'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_EMPLOYEES');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'MANAGE_EMPLOYEES', 
    'Gerenciar funcionários'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'MANAGE_EMPLOYEES');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_REPORTS', 
    'Visualizar relatórios'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_REPORTS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_CLIENTS', 
    'Visualizar clientes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_CLIENTS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'MANAGE_CLIENTS', 
    'Gerenciar clientes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'MANAGE_CLIENTS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_CONTRACTS', 
    'Visualizar contratos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_CONTRACTS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'MANAGE_CONTRACTS', 
    'Gerenciar contratos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'MANAGE_CONTRACTS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_FINANCIAL', 
    'Visualizar dados financeiros'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_FINANCIAL');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'VIEW_DOCUMENTS', 
    'Visualizar documentos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'VIEW_DOCUMENTS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'MANAGE_DOCUMENTS', 
    'Gerenciar documentos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'MANAGE_DOCUMENTS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'MANAGE_SYSTEM', 
    'Gerenciar sistema'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'MANAGE_SYSTEM');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PROPOSALS_READ', 
    'Visualizar propostas'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PROPOSALS_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PROPOSALS_CREATE', 
    'Criar propostas'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PROPOSALS_CREATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PROPOSALS_UPDATE', 
    'Atualizar propostas'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PROPOSALS_UPDATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PROPOSALS_DELETE', 
    'Excluir propostas'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PROPOSALS_DELETE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'QUOTES_READ', 
    'Visualizar orçamentos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'QUOTES_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'QUOTES_CREATE', 
    'Criar orçamentos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'QUOTES_CREATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'QUOTES_UPDATE', 
    'Atualizar orçamentos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'QUOTES_UPDATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'QUOTES_DELETE', 
    'Excluir orçamentos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'QUOTES_DELETE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'LEADS_READ', 
    'Visualizar leads'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'LEADS_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'LEADS_CREATE', 
    'Criar leads'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'LEADS_CREATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'LEADS_UPDATE', 
    'Atualizar leads'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'LEADS_UPDATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'LEADS_DELETE', 
    'Excluir leads'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'LEADS_DELETE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'GROUPS_READ', 
    'Visualizar grupos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'GROUPS_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'GROUPS_WRITE', 
    'Editar grupos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'GROUPS_WRITE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'GROUPS_CREATE', 
    'Criar grupos'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'GROUPS_CREATE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'AUDIT_READ', 
    'Visualizar auditoria'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'AUDIT_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'DASHBOARD_READ', 
    'Visualizar dashboard'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'DASHBOARD_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'DASHBOARD_WRITE', 
    'Editar dashboard'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'DASHBOARD_WRITE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PROFILE_READ', 
    'Visualizar perfil'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PROFILE_READ');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'PROFILE_WRITE', 
    'Editar perfil'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'PROFILE_WRITE');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'SYSTEM_CONFIG', 
    'Configurar sistema'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'SYSTEM_CONFIG');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'SYSTEM_LOGS', 
    'Visualizar logs do sistema'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'SYSTEM_LOGS');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'SYSTEM_BACKUP', 
    'Gerenciar backups'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'SYSTEM_BACKUP');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'SYSTEM_INTEGRATION', 
    'Gerenciar integrações'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'SYSTEM_INTEGRATION');

INSERT INTO permissions (id, name, description) 
SELECT 
    gen_random_uuid(), 
    'ALL_PERMISSIONS', 
    'Todas as permissões'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'ALL_PERMISSIONS');

-- Update existing permissions with descriptions
UPDATE permissions SET description = 'Visualizar usuários' WHERE name = 'USERS_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar usuários' WHERE name = 'USERS_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Editar usuários' WHERE name = 'USERS_WRITE' AND description IS NULL;
UPDATE permissions SET description = 'Excluir usuários' WHERE name = 'USERS_DELETE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar clientes' WHERE name = 'CLIENTS_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar clientes' WHERE name = 'CLIENTS_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Editar clientes' WHERE name = 'CLIENTS_WRITE' AND description IS NULL;
UPDATE permissions SET description = 'Excluir clientes' WHERE name = 'CLIENTS_DELETE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar contratos' WHERE name = 'CONTRACTS_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar contratos' WHERE name = 'CONTRACTS_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Editar contratos' WHERE name = 'CONTRACTS_WRITE' AND description IS NULL;
UPDATE permissions SET description = 'Excluir contratos' WHERE name = 'CONTRACTS_DELETE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar funcionários' WHERE name = 'EMPLOYEES_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar funcionários' WHERE name = 'EMPLOYEES_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Editar funcionários' WHERE name = 'EMPLOYEES_WRITE' AND description IS NULL;
UPDATE permissions SET description = 'Excluir funcionários' WHERE name = 'EMPLOYEES_DELETE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar postos de trabalho' WHERE name = 'WORK_POSTS_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar postos de trabalho' WHERE name = 'WORK_POSTS_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Editar postos de trabalho' WHERE name = 'WORK_POSTS_WRITE' AND description IS NULL;
UPDATE permissions SET description = 'Excluir postos de trabalho' WHERE name = 'WORK_POSTS_DELETE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar folha de pagamento' WHERE name = 'PAYROLL_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar folha de pagamento' WHERE name = 'PAYROLL_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Editar folha de pagamento' WHERE name = 'PAYROLL_WRITE' AND description IS NULL;
UPDATE permissions SET description = 'Excluir folha de pagamento' WHERE name = 'PAYROLL_DELETE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar frota' WHERE name = 'FLEET_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar registros de frota' WHERE name = 'FLEET_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Editar registros de frota' WHERE name = 'FLEET_WRITE' AND description IS NULL;
UPDATE permissions SET description = 'Excluir registros de frota' WHERE name = 'FLEET_DELETE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar relatórios' WHERE name = 'REPORTS_READ' AND description IS NULL;
UPDATE permissions SET description = 'Criar relatórios' WHERE name = 'REPORTS_CREATE' AND description IS NULL;
UPDATE permissions SET description = 'Visualizar configurações' WHERE name = 'SETTINGS_READ' AND description IS NULL;
UPDATE permissions SET description = 'Editar configurações' WHERE name = 'SETTINGS_WRITE' AND description IS NULL;

-- Update existing roles with descriptions
UPDATE roles SET description = 'Super Administrador com acesso total ao sistema' WHERE name = 'SUPER_ADMIN' AND description IS NULL;
UPDATE roles SET description = 'Administrador do sistema' WHERE name = 'ADMIN' AND description IS NULL;
UPDATE roles SET description = 'Recursos Humanos' WHERE name = 'RH' AND description IS NULL;
UPDATE roles SET description = 'Gestor/Coordenador' WHERE name = 'GESTOR' AND description IS NULL;
UPDATE roles SET description = 'Supervisor de equipe' WHERE name = 'SUPERVISOR' AND description IS NULL;
UPDATE roles SET description = 'Colaborador operacional' WHERE name = 'VIGILANTE' AND description IS NULL;
UPDATE roles SET description = 'Departamento Financeiro' WHERE name = 'FINANCEIRO' AND description IS NULL;
UPDATE roles SET description = 'Departamento Operacional' WHERE name = 'OPERACIONAL' AND description IS NULL; 