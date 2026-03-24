-- =====================================================
-- COPIE E COLE NO DBEAVER OU PGADMIN
-- =====================================================
-- Database: secured_guard
-- =====================================================

-- 1️⃣ VERIFICAR SE USUÁRIO TEM ROLES
SELECT 
    u.username,
    u.email,
    u.name,
    u.active,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616'
GROUP BY u.username, u.email, u.name, u.active;

-- ❗ SE total_roles = 0 OU NULL, execute o passo 2!
-- ❗ SE total_roles > 0, o problema é outro (veja logs do backend)

-- =====================================================

-- 2️⃣ CORRIGIR: ADICIONAR ROLE COLABORADOR
BEGIN;

-- Garantir que role COLABORADOR existe
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

-- Associar role ao usuário 05986003616
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = '05986003616'
  AND r.name = 'COLABORADOR'
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================

-- 3️⃣ VERIFICAR SE CORRIGIU
SELECT 
    u.username,
    u.email,
    r.name as role,
    '✅ CORRIGIDO!' as status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = '05986003616';

-- =====================================================
-- RESULTADO ESPERADO:
-- username: 05986003616
-- email: colaborador.05986003616@promovervigilancia.com.br
-- role: COLABORADOR
-- status: ✅ CORRIGIDO!
-- =====================================================

-- ✅ APÓS VER ESTE RESULTADO, TENTE FAZER LOGIN NOVAMENTE!

