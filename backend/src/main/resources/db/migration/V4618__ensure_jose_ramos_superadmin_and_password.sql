-- =====================================================
-- Migration: V4618__ensure_jose_ramos_superadmin_and_password.sql
-- Description: Padroniza o usuario super admin 'jose.ramos' com a senha 'FluxBus@2026'
--              nos ambientes de DEV, CI e PROD com role SUPER_ADMIN,
--              status ativo e 2FA/primeiro acesso desativados para login direto.
-- =====================================================

-- 1. Garantir que as roles fundamentais existam
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador com acesso irrestrito ao sistema', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'ADMIN', 'Administrador do sistema', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Atualizar ou inserir usuario jose.ramos
DO $$
DECLARE
    v_user_id UUID;
    v_super_admin_role_id UUID;
    v_admin_role_id UUID;
    v_password_hash VARCHAR := '$2a$10$l42eHMXMf0IZK2MWnW6azeIxot4vF8zyWBMI2cRgjdqQatf7/f/4C'; -- Hash BCrypt oficial de 'FluxBus@2026'
BEGIN
    SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'ADMIN' LIMIT 1;

    -- Verificar se o usuário já existe por username ou email
    SELECT id INTO v_user_id 
    FROM users 
    WHERE LOWER(username) = 'jose.ramos' 
       OR LOWER(email) IN ('jose.ramos@promovervigilancia.com.br', 'jose.ramos@fluxbus.com.br')
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Atualizar dados, senha e flags de acesso
        UPDATE users
        SET username = 'jose.ramos',
            password = v_password_hash,
            active = true,
            status = 'ACTIVE',
            first_access = false,
            two_factor_enabled = false,
            updated_at = NOW()
        WHERE id = v_user_id;

        RAISE NOTICE 'Usuário jose.ramos atualizado com sucesso com a senha padronizada FluxBus@2026.';
    ELSE
        -- Criar usuário caso não exista
        v_user_id := gen_random_uuid();

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
            INSERT INTO users (
                id, username, password, name, email, role, active, status, first_access, two_factor_enabled, created_at, updated_at
            ) VALUES (
                v_user_id,
                'jose.ramos',
                v_password_hash,
                'José Mário Ramos',
                'jose.ramos@promovervigilancia.com.br',
                'SUPER_ADMIN',
                true,
                'ACTIVE',
                false,
                false,
                NOW(),
                NOW()
            );
        ELSE
            INSERT INTO users (
                id, username, password, name, email, active, status, first_access, two_factor_enabled, created_at, updated_at
            ) VALUES (
                v_user_id,
                'jose.ramos',
                v_password_hash,
                'José Mário Ramos',
                'jose.ramos@promovervigilancia.com.br',
                true,
                'ACTIVE',
                false,
                false,
                NOW(),
                NOW()
            );
        END IF;

        RAISE NOTICE 'Usuário jose.ramos inserido com sucesso com a senha padronizada FluxBus@2026.';
    END IF;

    -- 3. Vincular role SUPER_ADMIN
    IF v_user_id IS NOT NULL AND v_super_admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (v_user_id, v_super_admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4. Vincular role ADMIN (redundância de compatibilidade)
    IF v_user_id IS NOT NULL AND v_admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (v_user_id, v_admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    -- 5. Limpar tokens de redefinição de senha pendentes caso existam
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
        DELETE FROM password_reset_tokens WHERE user_id = v_user_id;
    END IF;

    -- 6. Garantir consentimentos LGPD aceitos para o super admin
    IF v_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
        INSERT INTO user_consents (id, user_id, consent_type, term_version, accepted, accepted_at, created_at, updated_at, revoked)
        VALUES 
            (gen_random_uuid(), v_user_id, 'TERMS_OF_USE', '1.0', true, NOW(), NOW(), NOW(), false),
            (gen_random_uuid(), v_user_id, 'PRIVACY_POLICY', '1.0', true, NOW(), NOW(), NOW(), false),
            (gen_random_uuid(), v_user_id, 'DATA_PROCESSING', '1.0', true, NOW(), NOW(), NOW(), false)
        ON CONFLICT (user_id, consent_type, term_version) 
        DO UPDATE SET accepted = true, revoked = false, accepted_at = NOW(), updated_at = NOW();
    END IF;

END $$;
