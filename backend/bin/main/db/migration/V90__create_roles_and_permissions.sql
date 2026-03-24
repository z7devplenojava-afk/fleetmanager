-- Migration: V234__create_roles_and_permissions.sql
-- Description: Create roles and permissions for the system

-- Insert roles
INSERT INTO roles (id, name, description) VALUES
(gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador com acesso total ao sistema'),
(gen_random_uuid(), 'ADMIN', 'Administrador do sistema'),
(gen_random_uuid(), 'RH', 'Recursos Humanos'),
(gen_random_uuid(), 'GESTOR', 'Gestor/Coordenador'),
(gen_random_uuid(), 'SUPERVISOR', 'Supervisor de equipe'),
(gen_random_uuid(), 'VIGILANTE', 'Colaborador operacional'),
(gen_random_uuid(), 'FINANCEIRO', 'Departamento Financeiro'),
(gen_random_uuid(), 'OPERACIONAL', 'Departamento Operacional');

-- Insert permissions
INSERT INTO permissions (id, name) VALUES
-- User management
(gen_random_uuid(), 'USERS_READ'),
(gen_random_uuid(), 'USERS_CREATE'),
(gen_random_uuid(), 'USERS_WRITE'),
(gen_random_uuid(), 'USERS_DELETE'),

-- Client management
(gen_random_uuid(), 'CLIENTS_READ'),
(gen_random_uuid(), 'CLIENTS_CREATE'),
(gen_random_uuid(), 'CLIENTS_WRITE'),
(gen_random_uuid(), 'CLIENTS_DELETE'),

-- Contract management
(gen_random_uuid(), 'CONTRACTS_READ'),
(gen_random_uuid(), 'CONTRACTS_CREATE'),
(gen_random_uuid(), 'CONTRACTS_WRITE'),
(gen_random_uuid(), 'CONTRACTS_DELETE'),

-- Employee management
(gen_random_uuid(), 'EMPLOYEES_READ'),
(gen_random_uuid(), 'EMPLOYEES_CREATE'),
(gen_random_uuid(), 'EMPLOYEES_WRITE'),
(gen_random_uuid(), 'EMPLOYEES_DELETE'),

-- Work posts management
(gen_random_uuid(), 'WORK_POSTS_READ'),
(gen_random_uuid(), 'WORK_POSTS_CREATE'),
(gen_random_uuid(), 'WORK_POSTS_WRITE'),
(gen_random_uuid(), 'WORK_POSTS_DELETE'),

-- Payroll management
(gen_random_uuid(), 'PAYROLL_READ'),
(gen_random_uuid(), 'PAYROLL_CREATE'),
(gen_random_uuid(), 'PAYROLL_WRITE'),
(gen_random_uuid(), 'PAYROLL_DELETE'),

-- Fleet management
(gen_random_uuid(), 'FLEET_READ'),
(gen_random_uuid(), 'FLEET_CREATE'),
(gen_random_uuid(), 'FLEET_WRITE'),
(gen_random_uuid(), 'FLEET_DELETE'),

-- Reports
(gen_random_uuid(), 'REPORTS_READ'),
(gen_random_uuid(), 'REPORTS_CREATE'),

-- System settings
(gen_random_uuid(), 'SETTINGS_READ'),
(gen_random_uuid(), 'SETTINGS_WRITE');

-- Assign permissions to SUPER_ADMIN (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'),
    id
FROM permissions;

-- Assign permissions to ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id
FROM permissions
WHERE name IN (
    'USERS_READ', 'USERS_CREATE', 'USERS_WRITE',
    'CLIENTS_READ', 'CLIENTS_CREATE', 'CLIENTS_WRITE',
    'CONTRACTS_READ', 'CONTRACTS_CREATE', 'CONTRACTS_WRITE',
    'EMPLOYEES_READ', 'EMPLOYEES_CREATE', 'EMPLOYEES_WRITE',
    'WORK_POSTS_READ', 'WORK_POSTS_CREATE', 'WORK_POSTS_WRITE',
    'PAYROLL_READ', 'PAYROLL_CREATE', 'PAYROLL_WRITE',
    'FLEET_READ', 'FLEET_CREATE', 'FLEET_WRITE',
    'REPORTS_READ', 'REPORTS_CREATE',
    'SETTINGS_READ', 'SETTINGS_WRITE'
);

-- Assign permissions to RH
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'RH'),
    id
FROM permissions
WHERE name IN (
    'EMPLOYEES_READ', 'EMPLOYEES_CREATE', 'EMPLOYEES_WRITE',
    'PAYROLL_READ', 'PAYROLL_CREATE', 'PAYROLL_WRITE',
    'REPORTS_READ', 'REPORTS_CREATE',
    'SETTINGS_READ'
);

-- Assign permissions to GESTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'GESTOR'),
    id
FROM permissions
WHERE name IN (
    'EMPLOYEES_READ', 'EMPLOYEES_CREATE', 'EMPLOYEES_WRITE',
    'CONTRACTS_READ', 'CONTRACTS_CREATE', 'CONTRACTS_WRITE',
    'WORK_POSTS_READ', 'WORK_POSTS_CREATE', 'WORK_POSTS_WRITE',
    'REPORTS_READ', 'REPORTS_CREATE',
    'SETTINGS_READ'
);

-- Assign permissions to SUPERVISOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'SUPERVISOR'),
    id
FROM permissions
WHERE name IN (
    'EMPLOYEES_READ',
    'PAYROLL_READ',
    'REPORTS_READ',
    'SETTINGS_READ'
);

-- Assign permissions to VIGILANTE
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'VIGILANTE'),
    id
FROM permissions
WHERE name IN (
    'PAYROLL_READ',
    'SETTINGS_READ'
);

-- Assign permissions to FINANCEIRO
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'FINANCEIRO'),
    id
FROM permissions
WHERE name IN (
    'CLIENTS_READ',
    'CONTRACTS_READ',
    'PAYROLL_READ', 'PAYROLL_CREATE', 'PAYROLL_WRITE',
    'REPORTS_READ', 'REPORTS_CREATE',
    'SETTINGS_READ'
);

-- Assign permissions to OPERACIONAL
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'OPERACIONAL'),
    id
FROM permissions
WHERE name IN (
    'EMPLOYEES_READ',
    'WORK_POSTS_READ', 'WORK_POSTS_CREATE', 'WORK_POSTS_WRITE',
    'FLEET_READ', 'FLEET_CREATE', 'FLEET_WRITE',
    'REPORTS_READ',
    'SETTINGS_READ'
); 