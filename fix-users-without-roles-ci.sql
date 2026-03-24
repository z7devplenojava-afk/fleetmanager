-- Correção para usuários sem roles no ambiente CI
-- Execute este script no banco de dados do CI

BEGIN;

-- 1. Garantir que role COLABORADOR existe
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'COLABORADOR', 'Funcionário colaborador', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Associar role COLABORADOR a todos os usuários que não têm roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'COLABORADOR'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = u.id
  );

-- 3. Verificar resultado
SELECT 
    u.username,
    u.email,
    STRING_AGG(r.name, ', ') as roles,
    COUNT(r.id) as total_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.username, u.email
ORDER BY total_roles ASC, u.email
LIMIT 20;

COMMIT;
