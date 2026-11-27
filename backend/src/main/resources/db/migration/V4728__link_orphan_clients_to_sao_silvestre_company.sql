-- =============================================================================
-- V4728__link_orphan_clients_to_sao_silvestre_company.sql
-- Vincula clientes órfãos (company_id IS NULL) à empresa padrão
-- (preferencialmente Viação São Silvestre) para garantir que fiquem
-- visíveis no contexto multi-tenant.
-- =============================================================================

DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- 1. Localizar Viação São Silvestre ou VSS
    SELECT id INTO v_company_id
    FROM companies
    WHERE regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g') IN ('71055644000125', '71055644000630')
       OR UPPER(name) LIKE '%SAO SILVESTRE%'
       OR UPPER(name) LIKE '%SILVESTRE%'
       OR UPPER(COALESCE(sigla, '')) = 'VSS'
    ORDER BY created_at ASC NULLS LAST
    LIMIT 1;

    -- 2. Fallback para a primeira empresa cadastrada
    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM companies ORDER BY created_at ASC NULLS LAST LIMIT 1;
    END IF;

    -- 3. Atualizar clientes órfãos
    IF v_company_id IS NOT NULL THEN
        UPDATE clients
        SET company_id = v_company_id
        WHERE company_id IS NULL;

        RAISE NOTICE 'Clientes órfãos vinculados à empresa %', v_company_id;
    END IF;
END $$;
