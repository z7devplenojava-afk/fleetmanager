-- =====================================================
-- QUERY RÁPIDA - Corrigir jose.ramos
-- =====================================================
-- COPIE E COLE NO DBEAVER, EXECUTE TUDO DE UMA VEZ!
-- =====================================================

BEGIN;

-- 1. Criar role SUPER_ADMIN
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Criar usuário jose.ramos (se não existir)
INSERT INTO users (
    id, username, password, name, email, 
    active, status, first_access, two_factor_enabled, 
    created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'jose.ramos',
    '$2a$10$YmF0Y2g4MjQyNDI0MjQyNOdE7WvHF9cX4vK5Kx5Kx5Kx5Kx5Kx5K',
    'Jose Mario Ramos',
    'jose.ramos@promovervigilancia.com.br',
    true, 'ACTIVE', true, false, NOW(), NOW()
)
ON CONFLICT (username) DO UPDATE SET
    active = true,
    status = 'ACTIVE',
    first_access = true; -- Marcar primeiro acesso para resetar senha

-- 3. Adicionar role SUPER_ADMIN (se não tiver)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'jose.ramos' AND r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

-- 4. VERIFICAR RESULTADO
SELECT 
    u.username,
    u.email,
    u.name,
    u.active,
    u.status,
    u.first_access,
    STRING_AGG(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'jose.ramos'
GROUP BY u.username, u.email, u.name, u.active, u.status, u.first_access;

-- =====================================================
-- DEPOIS DE EXECUTAR:
-- =====================================================
-- 
-- OPÇÃO 1: Se first_access = true
-- → Login com qualquer senha vai pedir para trocar
-- → Sistema vai redirecionar para tela de primeiro acesso
--
-- OPÇÃO 2: Usar "Esqueci minha senha" no login
-- → Digite: jose.ramos@promovervigilancia.com.br
-- → Receberá email com link para resetar
--
-- =====================================================

