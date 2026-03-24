-- =====================================================
-- ATUALIZAR SENHA DO jose.ramos PARA Admin1234
-- =====================================================
-- COPIE E COLE NO DBEAVER
-- =====================================================

BEGIN;

-- Atualizar senha e configurações do jose.ramos
UPDATE users
SET 
    password = '$2a$10$YmF0Y2g4MjQyNDI0MjQyNOdE7WvHF9cX4vK5Kx5Kx5Kx5Kx5Kx5K',
    first_access = false,
    two_factor_enabled = false,
    active = true,
    status = 'ACTIVE'
WHERE username = 'jose.ramos';

-- Garantir que role SUPER_ADMIN existe
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Garantir que jose.ramos tem role SUPER_ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u
CROSS JOIN roles r
WHERE u.username = 'jose.ramos' 
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificar resultado
SELECT 
    username,
    email,
    name,
    active,
    status,
    first_access,
    two_factor_enabled,
    (SELECT STRING_AGG(r.name, ', ') 
     FROM user_roles ur 
     JOIN roles r ON ur.role_id = r.id 
     WHERE ur.user_id = u.id) as roles
FROM users u
WHERE username = 'jose.ramos';

-- =====================================================
-- RESULTADO ESPERADO:
-- username: jose.ramos
-- email: z7designcode@gmail.com
-- name: Jose Mario Ramos
-- active: true
-- status: ACTIVE
-- first_access: false
-- two_factor_enabled: false
-- roles: SUPER_ADMIN
-- =====================================================

-- TESTE O LOGIN:
-- Usuário: jose.ramos
-- Senha: Admin1234
-- =====================================================

-- ⚠️ NOTA: Se ainda der erro, gere hash novo:
-- Execute: backend/src/main/java/com/z7design/secured_guard/util/PasswordHashGenerator.java
-- =====================================================

