-- =========================================================
-- Migration V304: Atribuir ROLE COLABORADOR por Padrão de Email
-- =========================================================
-- REGRA DE NEGÓCIO:
-- Todos os usuários com email no padrão:
-- colaborador.*@promovervigilancia.com.br
-- devem ter automaticamente o ROLE COLABORADOR
-- =========================================================

-- 1. Garantir que ROLE COLABORADOR existe
INSERT INTO roles (id, name, description, created_at)
VALUES (
    gen_random_uuid(),
    'COLABORADOR',
    'Colaborador da empresa - acesso básico ao sistema',
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 2. Inserir ROLE COLABORADOR para todos os usuários com email colaborador.*@promovervigilancia.com.br
INSERT INTO user_roles (user_id, role_id)
SELECT 
    u.id as user_id,
    r.id as role_id
FROM users u
CROSS JOIN roles r
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
  AND r.name = 'COLABORADOR'
  AND NOT EXISTS (
      -- Evitar duplicatas
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = u.id
        AND ur.role_id = r.id
  );

-- 3. Log de usuários afetados
DO $$
DECLARE
    total_afetados INTEGER;
BEGIN
    SELECT COUNT(DISTINCT u.id) INTO total_afetados
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
      AND r.name = 'COLABORADOR';
    
    RAISE NOTICE '✅ Migration V304: % usuários com role COLABORADOR por padrão de email', total_afetados;
END $$;

