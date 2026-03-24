-- Script para inserir usuários de teste com os novos roles
-- Execute este script após a migração V200__update_user_roles.sql

-- Limpar usuários de teste existentes (opcional)
-- DELETE FROM user_groups WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%teste%');
-- DELETE FROM users WHERE email LIKE '%teste%';

-- Inserir usuários de teste com os novos roles

-- 🟥 SUPER_ADMIN
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'Super Admin Teste',
    'superadmin@teste.com',
    'superadmin',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'SUPER_ADMIN',
    true,
    NOW(),
    NOW()
);

-- 🟦 ADMIN
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'Admin Teste',
    'admin@teste.com',
    'admin',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'ADMIN',
    true,
    NOW(),
    NOW()
);

-- 🟩 SUPERVISOR
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'Supervisor Teste',
    'supervisor@teste.com',
    'supervisor',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'SUPERVISOR',
    true,
    NOW(),
    NOW()
);

-- 🟨 RH
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'RH Teste',
    'rh@teste.com',
    'rh',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'RH',
    true,
    NOW(),
    NOW()
);

-- 🟧 FINANCEIRO
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'Financeiro Teste',
    'financeiro@teste.com',
    'financeiro',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'FINANCEIRO',
    true,
    NOW(),
    NOW()
);

-- 🟪 TI_SUPORTE
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'TI Suporte Teste',
    'ti@teste.com',
    'ti',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'TI_SUPORTE',
    true,
    NOW(),
    NOW()
);

-- 🟫 AUDITOR
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'Auditor Teste',
    'auditor@teste.com',
    'auditor',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'AUDITOR',
    true,
    NOW(),
    NOW()
);

-- 🟨 COLABORADOR
INSERT INTO users (name, email, username, password, role, active, created_at, updated_at)
VALUES (
    'Colaborador Teste',
    'colaborador@teste.com',
    'colaborador',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', -- senha: 123456
    'COLABORADOR',
    true,
    NOW(),
    NOW()
);

-- Associar usuários aos grupos correspondentes
-- Super Admin
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'superadmin@teste.com' AND g.group_name = 'GRUPO_SUPER_ADMIN';

-- Admin
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'admin@teste.com' AND g.group_name = 'GRUPO_ADMIN';

-- Supervisor
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'supervisor@teste.com' AND g.group_name = 'GRUPO_SUPERVISOR';

-- RH
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'rh@teste.com' AND g.group_name = 'GRUPO_RH';

-- Financeiro
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'financeiro@teste.com' AND g.group_name = 'GRUPO_FINANCEIRO';

-- TI Suporte
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'ti@teste.com' AND g.group_name = 'GRUPO_TI_SUPORTE';

-- Auditor
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'auditor@teste.com' AND g.group_name = 'GRUPO_AUDITOR';

-- Colaborador
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id
FROM users u, groups g
WHERE u.email = 'colaborador@teste.com' AND g.group_name = 'GRUPO_COLABORADORES';

-- Verificar usuários criados
SELECT 
    u.name,
    u.email,
    u.username,
    u.role,
    u.active,
    g.group_name,
    g.display_name
FROM users u
LEFT JOIN user_groups ug ON u.id = ug.user_id
LEFT JOIN groups g ON ug.group_id = g.id
WHERE u.email LIKE '%teste%'
ORDER BY u.role, u.name; 