-- V4687: Vincular usuário teste.melo.7651 à Viação São Silvestre e associar unidades padrão à empresa
DO $$
DECLARE
    v_vss_id UUID;
    v_user_id UUID;
    v_emp_id UUID;
BEGIN
    -- 1. Obter o ID da empresa Viação São Silvestre
    SELECT id INTO v_vss_id
    FROM companies
    WHERE UPPER(name) LIKE '%SILVESTRE%'
       OR UPPER(COALESCE(sigla, '')) = 'VSS'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Se não encontrar por nome com "SILVESTRE", pega a primeira empresa cadastrada
    IF v_vss_id IS NULL THEN
        SELECT id INTO v_vss_id FROM companies ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF v_vss_id IS NOT NULL THEN
        -- 2. Localizar o usuário teste.melo.7651 ou por e-mail cesarnelsonmelo@br.festo.com
        SELECT id INTO v_user_id
        FROM users
        WHERE LOWER(username) LIKE '%teste.melo%'
           OR LOWER(username) LIKE '%cesar.melo%'
           OR LOWER(email) LIKE '%cesarnelsonmelo%'
           OR LOWER(name) LIKE '%césar nelson melo%'
           OR LOWER(name) LIKE '%cesar nelson melo%'
        LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            UPDATE users
            SET company_id = v_vss_id,
                updated_at = NOW()
            WHERE id = v_user_id;

            RAISE NOTICE 'Usuário % vinculado com sucesso à empresa %', v_user_id, v_vss_id;

            -- 3. Vincular também na tabela employees se existir funcionário para esse usuário
            UPDATE employees
            SET company_id = v_vss_id,
                user_id = v_user_id,
                updated_at = NOW()
            WHERE user_id = v_user_id
               OR LOWER(email) LIKE '%cesarnelsonmelo%'
               OR LOWER(name) LIKE '%césar nelson melo%'
               OR LOWER(name) LIKE '%cesar nelson melo%';
        END IF;

        -- 4. Garantir que as unidades base 'Matriz' e 'Unidade Padrao' pertençam à empresa principal caso não tenham vínculo
        UPDATE units
        SET company_id = v_vss_id,
            updated_at = NOW()
        WHERE (LOWER(name) = 'matriz' OR LOWER(name) = 'unidade padrao' OR LOWER(name) = 'unidade padrão')
          AND company_id IS NULL
          AND client_id IS NULL;

    END IF;
END $$;

