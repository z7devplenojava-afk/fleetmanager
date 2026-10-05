-- Migration: V4607__ensure_jose_ramos_active_and_password.sql
-- Description: Garante que o usuario jose.ramos esta ativo, com role SUPER_ADMIN e senha FluxBus@2026

-- 1. Criar role SUPER_ADMIN se nao existir
INSERT INTO roles (id, name, description, created_at)
VALUES (gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrador', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Atualizar ou inserir usuario jose.ramos com hash BCrypt oficial gerado pelo Spring Boot para 'FluxBus@2026'
DO $$
DECLARE
    v_user_id UUID;
    v_role_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;
    
    IF EXISTS (SELECT 1 FROM users WHERE LOWER(username) = 'jose.ramos') THEN
        UPDATE users
        SET password = '$2a$10$l42eHMXMf0IZK2MWnW6azeIxot4vF8zyWBMI2cRgjdqQatf7/f/4C',
            active = true,
            status = 'ACTIVE',
            first_access = false,
            two_factor_enabled = false,
            updated_at = NOW()
        WHERE LOWER(username) = 'jose.ramos';
        
        SELECT id INTO v_user_id FROM users WHERE LOWER(username) = 'jose.ramos' LIMIT 1;
    ELSE
        INSERT INTO users (
            id, username, password, name, email, active, status, first_access, two_factor_enabled, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            'jose.ramos',
            '$2a$10$l42eHMXMf0IZK2MWnW6azeIxot4vF8zyWBMI2cRgjdqQatf7/f/4C',
            'Jose Mario Ramos',
            'jose.ramos@promovervigilancia.com.br',
            true,
            'ACTIVE',
            false,
            false,
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
    END IF;
    
    IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_id, v_role_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
