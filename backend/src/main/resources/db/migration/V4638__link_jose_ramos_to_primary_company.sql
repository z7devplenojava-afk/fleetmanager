-- =====================================================
-- Migration V4638: Garantir acesso irrestrito de Super Admin para jose.ramos
-- =====================================================

DO $$
DECLARE
    v_super_admin_role_id UUID;
    v_admin_role_id UUID;
    v_user_id UUID;
BEGIN
    -- Obter IDs das roles
    SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1;
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'ADMIN' LIMIT 1;

    -- Localizar usuario jose.ramos
    SELECT id INTO v_user_id 
    FROM users 
    WHERE LOWER(username) = 'jose.ramos' 
       OR LOWER(email) IN ('jose.ramos@promovervigilancia.com.br', 'jose.ramos@fluxbus.com.br', 'jose.ramos@dominio.com')
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Garantir status ativo e sem restrições
        UPDATE users 
        SET active = true,
            status = 'ACTIVE',
            two_factor_enabled = false,
            first_access_completed = true,
            require_password_change = false
        WHERE id = v_user_id;

        -- Garantir role SUPER_ADMIN vinculada
        IF v_super_admin_role_id IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id)
            VALUES (v_user_id, v_super_admin_role_id)
            ON CONFLICT DO NOTHING;
        END IF;

        -- Garantir role ADMIN vinculada
        IF v_admin_role_id IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id)
            VALUES (v_user_id, v_admin_role_id)
            ON CONFLICT DO NOTHING;
        END IF;

        RAISE NOTICE 'Usuario jose.ramos configurado com sucesso como Super Admin irrestrito (sem vinculo fixo de empresa).';
    END IF;
END $$;
