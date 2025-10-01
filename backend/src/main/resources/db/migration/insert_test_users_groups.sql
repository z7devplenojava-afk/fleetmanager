-- Script para inserir usuários de teste e associá-los aos grupos
-- Execute este script após a migration V200__create_user_groups_tables.sql

-- Inserir usuários de teste
INSERT INTO users (id, username, email, password, name, role, status, active, created_at, updated_at) VALUES
-- Super Admin
('550e8400-e29b-41d4-a716-446655440001', 'superadmin@promover.com', 'superadmin@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Super Administrador', 'CEO', 'ACTIVE', true, NOW(), NOW()),

-- Admin
('550e8400-e29b-41d4-a716-446655440002', 'admin@promover.com', 'admin@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Administrador', 'ADMIN', 'ACTIVE', true, NOW(), NOW()),

-- RH
('550e8400-e29b-41d4-a716-446655440003', 'rh@promover.com', 'rh@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Recursos Humanos', 'RH', 'ACTIVE', true, NOW(), NOW()),

-- Departamento Pessoal
('550e8400-e29b-41d4-a716-446655440004', 'dpe@promover.com', 'dpe@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Departamento Pessoal', 'DEPARTAMENTO_PESSOAL', 'ACTIVE', true, NOW(), NOW()),

-- Gestor
('550e8400-e29b-41d4-a716-446655440005', 'gestor@promover.com', 'gestor@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Gestor', 'GESTOR', 'ACTIVE', true, NOW(), NOW()),

-- Supervisor
('550e8400-e29b-41d4-a716-446655440006', 'supervisor@promover.com', 'supervisor@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Supervisor', 'SUPERVISOR', 'ACTIVE', true, NOW(), NOW()),

-- Colaborador
('550e8400-e29b-41d4-a716-446655440007', 'colaborador@promover.com', 'colaborador@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Colaborador', 'COLABORADOR', 'ACTIVE', true, NOW(), NOW()),

-- Vigilante
('550e8400-e29b-41d4-a716-446655440008', 'vigilante@promover.com', 'vigilante@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Vigilante', 'VIGILANTE', 'ACTIVE', true, NOW(), NOW()),

-- Usuário Multi Grupo (para teste)
('550e8400-e29b-41d4-a716-446655440009', 'multigrupo@promover.com', 'multigrupo@promover.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'Usuário Multi Grupo', 'COLABORADOR', 'ACTIVE', true, NOW(), NOW());

-- Associar usuários aos grupos padrão
-- Super Admin -> GRUPO_SUPER_ADMIN
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1, NOW());

-- Admin -> GRUPO_ADMIN
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440002', 2, NOW());

-- RH -> GRUPO_RH
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440003', 4, NOW());

-- DPE -> GRUPO_DPE
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440004', 5, NOW());

-- Gestor -> GRUPO_GESTOR
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440005', 3, NOW());

-- Supervisor -> GRUPO_SUPERVISOR
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440006', 6, NOW());

-- Colaborador -> GRUPO_COLABORADORES
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440007', 7, NOW());

-- Vigilante -> GRUPO_VIGILANTES
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440008', 8, NOW());

-- Usuário Multi Grupo -> Múltiplos grupos (para teste)
INSERT INTO user_group_membership (user_id, group_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440009', 4, NOW()), -- GRUPO_RH
('550e8400-e29b-41d4-a716-446655440009', 6, NOW()); -- GRUPO_SUPERVISOR

-- Verificar os dados inseridos
SELECT 'Usuários criados:' as info;
SELECT username, email, role FROM users WHERE username LIKE '%@promover.com';

SELECT 'Associações de grupos:' as info;
SELECT 
    u.username,
    ug.display_name as grupo,
    ugm.created_at
FROM user_group_membership ugm
JOIN users u ON ugm.user_id = u.id
JOIN user_groups ug ON ugm.group_id = ug.id
ORDER BY u.username, ug.display_name;

SELECT 'Permissões do usuário multi grupo:' as info;
SELECT DISTINCT permission
FROM user_group_membership ugm
JOIN user_group_permissions ugp ON ugm.group_id = ugp.group_id
WHERE ugm.user_id = '550e8400-e29b-41d4-a716-446655440009'
ORDER BY permission; 