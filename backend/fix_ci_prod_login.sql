-- =====================================================
-- FIX SCRIPT: Restaurar/Garantir acesso jose.ramos em CI / PROD
-- =====================================================
-- Usuário: jose.ramos
-- Senha Padrão: FluxBus@2026  (Atenção ao 'F' maiúsculo e 'B' maiúsculo!)
-- Hash BCrypt: $2a$10$l42eHMXMf0IZK2MWnW6azeIxot4vF8zyWBMI2cRgjdqQatf7/f/4C
-- =====================================================

-- 1. Garantir que a role SUPER_ADMIN exista
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador com acesso irrestrito ao sistema', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'ADMIN', 'Administrador do sistema', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Atualizar ou Inserir o usuário jose.ramos
DO $$
DECLARE
    v_user_id UUID;
    v_super_admin_role_id UUID;
    v_admin_role_id UUID;
    v_password_hash VARCHAR := '$2a$10$l42eHMXMf0IZK2MWnW6azeIxot4vF8zyWBMI2cRgjdqQatf7/f/4C';
BEGIN
    SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'ADMIN' LIMIT 1;

    SELECT id INTO v_user_id 
    FROM users 
    WHERE LOWER(username) = 'jose.ramos' 
       OR LOWER(email) IN ('jose.ramos@promovervigilancia.com.br', 'jose.ramos@fluxbus.com.br')
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        UPDATE users
        SET username = 'jose.ramos',
            password = v_password_hash,
            active = true,
            status = 'ACTIVE',
            first_access = false,
            two_factor_enabled = false,
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        v_user_id := gen_random_uuid();
        INSERT INTO users (
            id, username, password, name, email, active, status, first_access, two_factor_enabled, created_at, updated_at
        ) VALUES (
            v_user_id,
            'jose.ramos',
            v_password_hash,
            'José Mário Ramos',
            'jose.ramos@fluxbus.com.br',
            true,
            'ACTIVE',
            false,
            false,
            NOW(),
            NOW()
        );
    END IF;

    IF v_user_id IS NOT NULL AND v_super_admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (v_user_id, v_super_admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
    END IF;

    IF v_user_id IS NOT NULL AND v_admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES (v_user_id, v_admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
