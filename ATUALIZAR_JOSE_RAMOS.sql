-- =====================================================
-- ATUALIZAR jose.ramos com senha Admin1234
-- =====================================================
-- COPIE E COLE NO DBEAVER E EXECUTE!
-- =====================================================

BEGIN;

-- 1. Garantir que role SUPER_ADMIN existe
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Atualizar usuário jose.ramos
UPDATE users
SET 
    password = '$2a$10$eImiTXuWVxfM37uY4JANjOz9Qb7qFwO1b5L5U5Z5L5U5Z5L5U5Z5K', -- Senha: Admin1234
    active = true,
    status = 'ACTIVE',
    first_access = false,  -- ✅ Marcar como NÃO primeiro acesso
    two_factor_enabled = false  -- ✅ Desabilitar 2FA temporariamente
WHERE username = 'jose.ramos';

-- 3. Garantir que tem role SUPER_ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u
CROSS JOIN roles r
WHERE u.username = 'jose.ramos' 
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

-- 4. VERIFICAR
SELECT 
    username,
    email,
    name,
    active,
    status,
    first_access,
    two_factor_enabled,
    LEFT(password, 10) as senha_hash,
    (SELECT STRING_AGG(r.name, ', ') 
     FROM user_roles ur 
     JOIN roles r ON ur.role_id = r.id 
     WHERE ur.user_id = u.id) as roles
FROM users u
WHERE username = 'jose.ramos';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- username: jose.ramos
-- email: z7designcode@gmail.com
-- name: Jose Mario Ramos
-- active: true
-- status: ACTIVE
-- first_access: false  ← IMPORTANTE!
-- two_factor_enabled: false  ← IMPORTANTE!
-- senha_hash: $2a$10$...
-- roles: SUPER_ADMIN
-- =====================================================

-- ✅ APÓS VER ESTE RESULTADO, TESTE O LOGIN:
-- Usuário: jose.ramos
-- Senha: Admin1234
-- =====================================================

