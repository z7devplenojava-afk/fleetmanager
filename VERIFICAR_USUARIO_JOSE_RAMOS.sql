-- =====================================================
-- VERIFICAR USUÁRIO jose.ramos
-- =====================================================
-- Execute no DBeaver no banco: secured_guard_test

-- 1. Verificar dados do usuário
SELECT 
    id,
    username,
    name,
    email,
    active,
    status,
    first_access,
    two_factor_enabled,
    password,
    created_at
FROM users 
WHERE username = 'jose.ramos';

-- 2. Verificar roles do usuário
SELECT 
    u.username,
    r.name AS role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'jose.ramos';

-- 3. Se não existir, criar usuário de teste
INSERT INTO users (
    id,
    username,
    password,
    name,
    email,
    active,
    status,
    first_access,
    two_factor_enabled,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'jose.ramos',
    '$2a$10$N9qo8uLOickgx2ZMYq7FZu5XKPd6XmR7yv4Wf5d7LqL.zLWZJQlQG', -- Admin1234
    'José Mário Ramos',
    'jose.ramos@promovervigilancia.com.br',
    true,
    'ACTIVE',
    false,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    password = '$2a$10$N9qo8uLOickgx2ZMYq7FZu5XKPd6XmR7yv4Wf5d7LqL.zLWZJQlQG',
    first_access = false,
    two_factor_enabled = false;

-- 4. Adicionar role SUPER_ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'jose.ramos' 
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- 5. Verificar resultado
SELECT 
    u.username,
    u.name,
    u.email,
    u.active,
    u.first_access,
    r.name AS role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'jose.ramos';

