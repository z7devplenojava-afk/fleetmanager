-- =============================================================================
-- V4662__link_orphan_records_to_sao_silvestre.sql
-- Vincula registros operacionais orfaos (company_id IS NULL) a empresa
-- Viacao Sao Silvestre para que seus usuarios tenham visibilidade no multi-tenant.
--
-- IMPORTANTE: nem todas as tabelas listadas possuem company_id (por exemplo
-- work_posts, routes e purchase_requests). A migracao verifica a existencia da
-- coluna antes de executar o UPDATE para nao bloquear a inicializacao do backend.
-- =============================================================================

DO $$
DECLARE
    v_vss_id UUID;
    v_table TEXT;
    v_tables TEXT[] := ARRAY[
        'vehicles',
        'employees',
        'stock_items',
        'stock_invoice_entries',
        'material_requisitions',
        'fleet_work_orders',
        'vehicle_maintenances',
        'fuel_records',
        'tires',
        'vehicle_batteries',
        'vehicle_gate_checklists',
        'vehicle_inspections',
        'vehicle_cleaning_orders',
        'vehicle_documents',
        'garages',
        'work_posts',
        'units',
        'routes',
        'schedules',
        'purchase_requests'
    ];
BEGIN
    SELECT id INTO v_vss_id
    FROM companies
    WHERE regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g') IN ('71055644000125', '71055644000630')
       OR UPPER(name) LIKE '%SAO SILVESTRE%'
       OR UPPER(name) LIKE '%SILVESTRE%'
       OR UPPER(COALESCE(sigla, '')) = 'VSS'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_vss_id IS NULL THEN
        RAISE NOTICE 'Viacao Sao Silvestre nao localizada na tabela companies.';
        RETURN;
    END IF;

    FOREACH v_table IN ARRAY v_tables
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = v_table
              AND column_name = 'company_id'
        ) THEN
            EXECUTE format('UPDATE %I SET company_id = $1 WHERE company_id IS NULL', v_table)
            USING v_vss_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Atualizacao de registros orfaos concluida com sucesso.';
END $$;
