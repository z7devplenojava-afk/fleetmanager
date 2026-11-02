-- V4676: Vincula rotas órfãs (company_id IS NULL) à empresa padrão (Viação São Silvestre)
-- para garantir visibilidade sob o filtro multi-tenant.

DO $$
DECLARE
    v_vss_id UUID;
BEGIN
    SELECT id INTO v_vss_id
    FROM companies
    WHERE regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g') IN ('71055644000125', '71055644000630')
       OR UPPER(name) LIKE '%SAO SILVESTRE%'
       OR UPPER(name) LIKE '%SILVESTRE%'
       OR UPPER(COALESCE(sigla, '')) = 'VSS'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_vss_id IS NOT NULL THEN
        UPDATE routes
        SET company_id = v_vss_id
        WHERE company_id IS NULL;
    END IF;
END $$;
