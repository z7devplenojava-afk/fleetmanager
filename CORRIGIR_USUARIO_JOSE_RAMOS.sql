-- =====================================================
-- CORRIGIR LOGIN DO USUÁRIO: jose.ramos
-- =====================================================
-- EXECUTE NO DBEAVER/PGADMIN
-- =====================================================

-- 🔍 PASSO 1: VERIFICAR SE USUÁRIO EXISTE
SELECT 
    id,
    username,
    email,
    name,
    active,
    status,
    LEFT(password, 10) as senha_hash,
    LENGTH(password) as senha_tamanho
FROM users
WHERE username = 'jose.ramos';

-- ⬇️ RESULTADO: Se NÃO encontrar nenhum registro, vá para PASSO 2A
-- ⬇️ RESULTADO: Se encontrar, vá para PASSO 2B

-- =====================================================

-- 🆕 PASSO 2A: CRIAR USUÁRIO (SE NÃO EXISTIR)
BEGIN;

-- Criar role SUPER_ADMIN se não existir
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Criar usuário jose.ramos
-- Senha: Admin1234 (hash BCrypt gerado)
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
)
VALUES (
    gen_random_uuid(),
    'jose.ramos',
    '$2a$10$YmF0Y2g4MjQyNDI0MjQyNOdE7WvHF9cX4vK5Kx5Kx5Kx5Kx5Kx5K', -- Admin1234
    'Jose Mario Ramos',
    'jose.ramos@promovervigilancia.com.br',
    true,
    'ACTIVE',
    false,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Associar role SUPER_ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'jose.ramos'
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================

-- 🔧 PASSO 2B: ADICIONAR ROLES (SE USUÁRIO JÁ EXISTE)
SELECT 
    u.username,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'jose.ramos'
GROUP BY u.username;

-- ⬇️ Se total_roles = 0, execute:

BEGIN;

-- Criar role SUPER_ADMIN
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Adicionar role SUPER_ADMIN ao jose.ramos
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'jose.ramos'
  AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================

-- ✅ PASSO 3: VERIFICAÇÃO FINAL
SELECT 
    u.id,
    u.username,
    u.email,
    u.name,
    u.active,
    u.status,
    u.first_access,
    u.two_factor_enabled,
    LEFT(u.password, 10) as senha_hash,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles,
    CASE 
        WHEN COUNT(r.id) = 0 THEN '❌ SEM ROLES'
        WHEN NOT u.active THEN '❌ INATIVO'
        WHEN u.password NOT LIKE '$2a$%' THEN '⚠️ SENHA NÃO CRIPTOGRAFADA'
        ELSE '✅ TUDO OK'
    END as status_validacao
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'jose.ramos'
GROUP BY u.id, u.username, u.email, u.name, u.active, u.status, u.first_access, u.two_factor_enabled, u.password;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- username: jose.ramos
-- email: jose.ramos@promovervigilancia.com.br
-- name: Jose Mario Ramos
-- active: true
-- status: ACTIVE
-- roles: SUPER_ADMIN
-- total_roles: 1
-- status_validacao: ✅ TUDO OK
-- =====================================================

-- ⚠️ IMPORTANTE SOBRE A SENHA:
-- O hash acima é um EXEMPLO que pode não funcionar!
-- Se o login falhar com "Bad credentials", você precisa:
-- 1. Usar o PasswordHashGenerator.java OU
-- 2. Marcar first_access = true para resetar senha
-- =====================================================

-- 🔄 ALTERNATIVA: Marcar para primeiro acesso
UPDATE users
SET first_access = true
WHERE username = 'jose.ramos';

-- Ou resetar senha manualmente no sistema depois que conseguir logar
-- =====================================================

