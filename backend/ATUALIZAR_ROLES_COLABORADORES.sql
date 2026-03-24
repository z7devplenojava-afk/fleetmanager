-- =========================================================
-- Script para Atualizar ROLES de Colaboradores
-- =========================================================
-- REGRA: Todos com email colaborador.*@promovervigilancia.com.br
--        devem ter o ROLE COLABORADOR
-- =========================================================

BEGIN;

-- 1. Verificar quantos usuários serão afetados
SELECT 
    id,
    username,
    name,
    email,
    status
FROM users
WHERE email LIKE 'colaborador.%@promovervigilancia.com.br';

-- 2. Garantir que ROLE COLABORADOR existe
INSERT INTO roles (id, name, description, created_at)
VALUES (
    gen_random_uuid(),
    'COLABORADOR',
    'Colaborador da empresa - acesso básico',
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 3. Buscar ID do role COLABORADOR
DO $$
DECLARE
    colaborador_role_id UUID;
    user_record RECORD;
BEGIN
    -- Obter ID do role COLABORADOR
    SELECT id INTO colaborador_role_id
    FROM roles
    WHERE name = 'COLABORADOR';
    
    RAISE NOTICE 'Role COLABORADOR ID: %', colaborador_role_id;
    
    -- Para cada usuário com email colaborador.*@promovervigilancia.com.br
    FOR user_record IN 
        SELECT id, username, email 
        FROM users 
        WHERE email LIKE 'colaborador.%@promovervigilancia.com.br'
    LOOP
        -- Verificar se já tem o role
        IF NOT EXISTS (
            SELECT 1 
            FROM user_roles 
            WHERE user_id = user_record.id 
              AND role_id = colaborador_role_id
        ) THEN
            -- Inserir role COLABORADOR
            INSERT INTO user_roles (user_id, role_id)
            VALUES (user_record.id, colaborador_role_id);
            
            RAISE NOTICE 'Role COLABORADOR adicionado para: % (%)', user_record.username, user_record.email;
        ELSE
            RAISE NOTICE 'Usuário % já possui role COLABORADOR', user_record.username;
        END IF;
    END LOOP;
END $$;

-- 4. Verificar resultado
SELECT 
    u.username,
    u.name,
    u.email,
    u.status,
    r.name as role,
    u.active,
    u.first_access
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
ORDER BY u.email;

-- 5. Contar usuários atualizados
SELECT 
    COUNT(DISTINCT u.id) as total_colaboradores,
    COUNT(DISTINCT ur.user_id) as total_com_role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email LIKE 'colaborador.%@promovervigilancia.com.br'
  AND r.name = 'COLABORADOR';

COMMIT;

-- =========================================================
-- RESULTADO ESPERADO:
-- Todos os usuários com email colaborador.*@promovervigilancia.com.br
-- agora têm o ROLE COLABORADOR
-- =========================================================

