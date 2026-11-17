-- ==============================================================================
-- Migration: V4714__ensure_jose_ramos_password_fluxbus2026.sql
-- Descrição: Redefine expressamente a senha do usuário SUPER_ADMIN 'jose.ramos'
--            para 'FluxBus@2026' em todos os ambientes (DEV, CI, PROD).
--            Remove qualquer restrição de primeiro acesso, bloqueio ou 2FA.
-- ==============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_sa_role_id UUID;
    v_sa_group_id UUID;
    -- Hash oficial BCrypt (10 rounds) gerado pelo Spring Boot para a senha 'FluxBus@2026'
    v_password_hash VARCHAR := '$2a$10$l42eHMXMf0IZK2MWnW6azeIxot4vF8zyWBMI2cRgjdqQatf7/f/4C';
BEGIN
    -- 1. Obter role SUPER_ADMIN
    SELECT id INTO v_sa_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;
    IF v_sa_role_id IS NULL THEN
        v_sa_role_id := gen_random_uuid();
        INSERT INTO roles (id, name, description, created_at)
        VALUES (v_sa_role_id, 'SUPER_ADMIN', 'Super Administrador com acesso total', NOW())
        ON CONFLICT (name) DO NOTHING;
    END IF;

    -- 2. Localizar usuário jose.ramos por username ou email
    SELECT id INTO v_user_id 
    FROM users 
    WHERE LOWER(username) = 'jose.ramos' 
       OR LOWER(email) IN ('jose.ramos@fluxbus.com.br', 'jose.ramos@promovervigilancia.com.br', 'jose.ramos@dominio.com')
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Atualizar senha e desbloquear acesso irrestrito
        UPDATE users 
        SET username = 'jose.ramos',
            password = v_password_hash,
            email = COALESCE(email, 'jose.ramos@fluxbus.com.br'),
            name = COALESCE(name, 'José Mário Ramos'),
            active = true,
            status = 'ACTIVE',
            blocked = false,
            first_access = false,
            first_access_completed = true,
            require_password_change = false,
            two_factor_enabled = false,
            updated_at = NOW()
        WHERE id = v_user_id;

        RAISE NOTICE 'Senha e permissões de jose.ramos atualizadas com sucesso para FluxBus@2026.';
    ELSE
        -- Usuário não existia: criar novo
        v_user_id := '8b63e5ce-0a98-490d-b11f-82990b3dc5be'::uuid;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
            INSERT INTO users (
                id, username, password, email, name, role, status, active, blocked, first_access, first_access_completed, require_password_change, two_factor_enabled, created_at, updated_at
            ) VALUES (
                v_user_id,
                'jose.ramos',
                v_password_hash,
                'jose.ramos@fluxbus.com.br',
                'José Mário Ramos',
                'SUPER_ADMIN',
                'ACTIVE',
                true,
                false,
                false,
                true,
                false,
                false,
                NOW(),
                NOW()
            );
        ELSE
            INSERT INTO users (
                id, username, password, email, name, status, active, blocked, first_access, first_access_completed, require_password_change, two_factor_enabled, created_at, updated_at
            ) VALUES (
                v_user_id,
                'jose.ramos',
                v_password_hash,
                'jose.ramos@fluxbus.com.br',
                'José Mário Ramos',
                'ACTIVE',
                true,
                false,
                false,
                true,
                false,
                false,
                NOW(),
                NOW()
            );
        END IF;

        RAISE NOTICE 'Usuário jose.ramos criado com sucesso com a senha FluxBus@2026.';
    END IF;

    -- 3. Vincular role SUPER_ADMIN na tabela user_roles
    IF v_user_id IS NOT NULL AND v_sa_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (v_user_id, v_sa_role_id, NOW())
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    -- 4. Vincular ao grupo GRUPO_SUPER_ADMIN se existir
    SELECT id INTO v_sa_group_id FROM user_groups WHERE group_name = 'GRUPO_SUPER_ADMIN' LIMIT 1;
    IF v_user_id IS NOT NULL AND v_sa_group_id IS NOT NULL THEN
        INSERT INTO user_group_membership (user_id, group_id, created_at)
        VALUES (v_user_id, v_sa_group_id, NOW())
        ON CONFLICT (user_id, group_id) DO NOTHING;
    END IF;

END $$;
