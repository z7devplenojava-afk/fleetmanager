-- =====================================================
-- ABRA NO DBEAVER E EXECUTE ESTAS QUERIES
-- =====================================================
-- Banco: fluxbus
-- Porta: 5432
-- =====================================================

-- 🔍 PASSO 1: VERIFICAR USUÁRIO
SELECT 
    u.username,
    u.email,
    u.name,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616'
GROUP BY u.username, u.email, u.name;

-- ⬇️ OLHE O RESULTADO: Se total_roles = 0, execute o PASSO 2!

-- =====================================================

-- 🔧 PASSO 2: CORRIGIR (Execute só se total_roles = 0)
BEGIN;

-- Criar role COLABORADOR
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Adicionar role ao usuário
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = '05986003616'
  AND r.name = 'COLABORADOR';

COMMIT;

-- =====================================================

-- ✅ PASSO 3: VERIFICAR
SELECT 
    u.username,
    r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616';

-- RESULTADO ESPERADO:
-- username: 05986003616
-- role: COLABORADOR

-- ✅ SE VIU ESTE RESULTADO, TENTE LOGIN NOVAMENTE!

