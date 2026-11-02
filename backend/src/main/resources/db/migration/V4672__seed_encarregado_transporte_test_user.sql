-- =============================================================================
-- Migration V4672: Cadastrar usuário de teste para o perfil Encarregado de Transporte / Gestor de Tráfego
-- Login: encarregado.transporte
-- Email: encarregado.transporte@fluxbus.com.br
-- Senha: FluxBus@2026
-- Roles: ENCARREGADO_DE_TRANSPORTES, GESTOR_TRAFEGO
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_role_encarregado_id UUID;
    v_role_gestor_id UUID;
    v_company_id UUID;
    v_password_hash VARCHAR := '$2a$10$l42eHMXMf0IZK2MWnW6azeIxot4vF8zyWBMI2cRgjdqQatf7/f/4C'; -- Hash BCrypt de FluxBus@2026
BEGIN
    -- 1. Obter uma empresa válida (preferencialmente Viação São Silvestre ou FluxBus)
    SELECT id INTO v_company_id
    FROM companies
    WHERE UPPER(name) LIKE '%SILVESTRE%'
       OR UPPER(name) LIKE '%FLUXBUS%'
       OR UPPER(COALESCE(sigla, '')) = 'VSS'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Se não encontrar por nome, seleciona a primeira empresa cadastrada
    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM companies ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- 2. Garantir que as roles necessárias existem
    SELECT id INTO v_role_encarregado_id FROM roles WHERE name = 'ENCARREGADO_DE_TRANSPORTES' LIMIT 1;
    IF v_role_encarregado_id IS NULL THEN
        v_role_encarregado_id := gen_random_uuid();
        INSERT INTO roles (id, name, description, created_at)
        VALUES (v_role_encarregado_id, 'ENCARREGADO_DE_TRANSPORTES', 'Encarregado de Transportes - Gestão Operacional de Tráfego, Escalas, Linhas e Frotas', NOW());
    END IF;

    SELECT id INTO v_role_gestor_id FROM roles WHERE name = 'GESTOR_TRAFEGO' LIMIT 1;
    IF v_role_gestor_id IS NULL THEN
        v_role_gestor_id := gen_random_uuid();
        INSERT INTO roles (id, name, description, created_at)
        VALUES (v_role_gestor_id, 'GESTOR_TRAFEGO', 'Gestor de Tráfego - Gestão Operacional e Escalas', NOW());
    END IF;

    -- 3. Verificar se o usuário já existe
    SELECT id INTO v_user_id
    FROM users
    WHERE LOWER(username) = 'encarregado.transporte'
       OR LOWER(email) = 'encarregado.transporte@fluxbus.com.br'
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Atualizar usuário existente garantindo status ativo e senha
        UPDATE users
        SET username = 'encarregado.transporte',
            email = 'encarregado.transporte@fluxbus.com.br',
            name = 'Carlos Eduardo (Encarregado de Transporte)',
            password = v_password_hash,
            active = true,
            status = 'ACTIVE',
            blocked = false,
            first_access = false,
            first_access_completed = true,
            two_factor_enabled = false,
            require_password_change = false,
            company_id = COALESCE(company_id, v_company_id),
            department = 'Tráfego e Transportes',
            position = 'Encarregado de Transporte',
            updated_at = NOW()
        WHERE id = v_user_id;

        RAISE NOTICE 'Usuário encarregado.transporte atualizado com sucesso.';
    ELSE
        -- Criar novo usuário
        v_user_id := gen_random_uuid();

        INSERT INTO users (
            id,
            username,
            email,
            name,
            password,
            active,
            status,
            blocked,
            first_access,
            first_access_completed,
            two_factor_enabled,
            require_password_change,
            whatsapp_consent,
            company_id,
            department,
            position,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            'encarregado.transporte',
            'encarregado.transporte@fluxbus.com.br',
            'Carlos Eduardo (Encarregado de Transporte)',
            v_password_hash,
            true,
            'ACTIVE',
            false,
            false,
            true,
            false,
            false,
            false,
            v_company_id,
            'Tráfego e Transportes',
            'Encarregado de Transporte',
            NOW(),
            NOW()
        );

        RAISE NOTICE 'Usuário encarregado.transporte criado com ID: %', v_user_id;
    END IF;

    -- 4. Associar roles ao usuário na tabela user_roles
    INSERT INTO user_roles (user_id, role_id)
    VALUES 
        (v_user_id, v_role_encarregado_id),
        (v_user_id, v_role_gestor_id)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Roles ENCARREGADO_DE_TRANSPORTES e GESTOR_TRAFEGO associadas com sucesso ao usuário.';
END $$;
