-- ========================================
-- Script para Verificar Dados do Usuário
-- ========================================

-- 1. Verificar usuários cadastrados
SELECT 
    id,
    username,
    name,
    email,
    active,
    first_access,
    two_factor_enabled,
    status,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar roles do usuário
SELECT 
    u.username,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- 3. Verificar se usuário tem ID válido
SELECT 
    id,
    username,
    CASE WHEN id IS NULL THEN 'SEM ID!' ELSE 'OK' END as status_id
FROM users;

-- 4. Verificar permissões customizadas
SELECT 
    ucp.id,
    u.username,
    ucp.permission_key,
    ucp.is_active,
    ucp.granted_at
FROM user_custom_permissions ucp
JOIN users u ON ucp.user_id = u.id
WHERE ucp.is_active = true
ORDER BY ucp.granted_at DESC;

-- 5. Verificar se existe usuário "admin" ou "super_admin"
SELECT *
FROM users
WHERE username IN ('admin', 'superadmin', 'super_admin', 'Jose Mario Ramos')
   OR email LIKE '%admin%';

-- 6. Criar usuário de teste (SE NÃO EXISTIR)
-- DESCOMENTE AS LINHAS ABAIXO SE PRECISAR CRIAR UM NOVO USUÁRIO:

/*
-- Inserir usuário de teste
INSERT INTO users (id, username, password, name, email, active, first_access, two_factor_enabled, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'testuser',
    '$2a$10$Xvz6WQd9l3h.MvD8jFxH.OQx8xFq0xQx8xFq0xQx8xFq0xQx8xFq0', -- senha: Test123!
    'Usuario de Teste',
    'test@test.com',
    true,
    false,
    false,
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Inserir role SUPER_ADMIN para o usuário de teste
INSERT INTO user_roles (user_id, role_id)
SELECT 
    u.id,
    r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'testuser'
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;
*/

-- 7. Verificar estrutura da tabela users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

