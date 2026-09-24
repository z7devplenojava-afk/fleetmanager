-- =====================================================
-- SEED: Usuário jose.ramos para ambiente CI
-- =====================================================
-- Senha: FluxBus@2026
-- Hash BCrypt (10 rounds):
-- $2a$10$5.JlL1u3TUvbMfuCFGZWke5o0tRJMwFjpJPjx1dyCJbJqXpW5yXAm
-- =====================================================

-- Garantir que os roles necessários existam
INSERT INTO roles (id, name, description)
SELECT gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador com acesso total ao sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SUPER_ADMIN');

INSERT INTO roles (id, name, description)
SELECT gen_random_uuid(), 'ADMIN', 'Administrador do sistema'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');

-- Criar usuário jose.ramos se não existir
DO $$
BEGIN
    -- Inserir usuário (esquema novo sem coluna role)
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'jose.ramos') THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name = 'role'
        ) THEN
            INSERT INTO users (id, username, password, email, name, role, status, active, created_at, updated_at)
            VALUES (
                '20202020-2020-2020-2020-202020202020'::uuid,
                'jose.ramos',
                '$2a$10$5.JlL1u3TUvbMfuCFGZWke5o0tRJMwFjpJPjx1dyCJbJqXpW5yXAm',
                'jose.ramos@fluxbus.com.br',
                'José Mário Ramos',
                'ADMIN',
                'ACTIVE',
                true,
                NOW(),
                NOW()
            );
        ELSE
            INSERT INTO users (id, username, password, email, name, status, active, created_at, updated_at)
            VALUES (
                '20202020-2020-2020-2020-202020202020'::uuid,
                'jose.ramos',
                '$2a$10$5.JlL1u3TUvbMfuCFGZWke5o0tRJMwFjpJPjx1dyCJbJqXpW5yXAm',
                'jose.ramos@fluxbus.com.br',
                'José Mário Ramos',
                'ACTIVE',
                true,
                NOW(),
                NOW()
            );
        END IF;

        RAISE NOTICE 'Usuário jose.ramos criado com sucesso.';
    ELSE
        -- Atualizar senha e garantir ativo
        UPDATE users
        SET password   = '$2a$10$5.JlL1u3TUvbMfuCFGZWke5o0tRJMwFjpJPjx1dyCJbJqXpW5yXAm',
            active     = true,
            status     = 'ACTIVE',
            updated_at = NOW()
        WHERE username = 'jose.ramos';

        RAISE NOTICE 'Usuário jose.ramos já existia — senha e status atualizados.';
    END IF;
END $$;

-- Atribuir role SUPER_ADMIN ao jose.ramos
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT
    (SELECT id FROM users WHERE username = 'jose.ramos'),
    r.id,
    NOW()
FROM roles r
WHERE r.name = 'SUPER_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM users WHERE username = 'jose.ramos')
        AND ur.role_id = r.id
  );

-- Atribuir role ADMIN ao jose.ramos (redundante mas seguro)
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT
    (SELECT id FROM users WHERE username = 'jose.ramos'),
    r.id,
    NOW()
FROM roles r
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT id FROM users WHERE username = 'jose.ramos')
        AND ur.role_id = r.id
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Seed jose.ramos concluído!';
    RAISE NOTICE '   Login: jose.ramos / FluxBus@2026';
    RAISE NOTICE '   Role: SUPER_ADMIN + ADMIN';
END $$;
