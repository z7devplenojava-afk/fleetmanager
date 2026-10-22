-- =============================================================================
-- V4662__link_orphan_records_to_sao_silvestre.sql
-- Vincula registros operacionais orfaos (company_id IS NULL) a empresa
-- Viacao Sao Silvestre para que seus usuarios tenham visibilidade no multi-tenant.
--
-- Observacoes:
--  * Nem todas as tabelas listadas possuem company_id (ex.: work_posts, routes e
--    purchase_requests). A existencia da coluna e verificada antes do UPDATE.
--  * Algumas tabelas possuem restricoes de unicidade compostas com company_id
--    (ex.: stock_items -> uk_stock_items_company_code UNIQUE (company_id, code)).
--    Quando dois orfaos compartilham a mesma chave, ou quando a chave ja existe
--    para a empresa de destino, o UPDATE em massa viola a constraint. Nesse caso
--    a migracao cai para uma vinculacao registro-a-registro que ignora apenas os
--    conflitos, garantindo que a inicializacao do backend nunca seja bloqueada.
-- =============================================================================

DO $$
DECLARE
    v_vss_id UUID;
    v_table TEXT;
    v_ctid TID;
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
            BEGIN
                EXECUTE format('UPDATE %I SET company_id = $1 WHERE company_id IS NULL', v_table)
                USING v_vss_id;
            EXCEPTION WHEN unique_violation THEN
                -- Ha orfaos que colidem com registros ja existentes da empresa
                -- (ou entre si). Vincula um a um, ignorando somente os conflitos.
                RAISE NOTICE 'Tabela %: conflito de unicidade; vinculando orfaos sem conflito.', v_table;

                FOR v_ctid IN EXECUTE format('SELECT ctid FROM %I WHERE company_id IS NULL', v_table)
                LOOP
                    BEGIN
                        EXECUTE format('UPDATE %I SET company_id = $1 WHERE ctid = $2 AND company_id IS NULL', v_table)
                        USING v_vss_id, v_ctid;
                    EXCEPTION WHEN unique_violation THEN
                        -- Orfao duplicado: permanece sem empresa.
                        NULL;
                    END;
                END LOOP;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE 'Atualizacao de registros orfaos concluida com sucesso.';
END $$;
