-- =============================================================================
-- V4662__link_orphan_records_to_sao_silvestre.sql
-- Vincula todos os registros operacionais órfãos (company_id IS NULL)
-- à empresa Viação São Silvestre para que seus usuários (COMPANY_ADMIN,
-- MANUTENÇÃO, RH, etc.) tenham visibilidade total dos dados no multi-tenant.
-- =============================================================================

DO $$
DECLARE
    v_vss_id UUID;
BEGIN
    -- 1. Localizar a empresa Viação São Silvestre pelo CNPJ ou Nome/Sigla
    SELECT id INTO v_vss_id 
    FROM companies 
    WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '-', ''), '/', '') IN ('71055644000125', '71055644000630')
       OR UPPER(name) LIKE '%SAO SILVESTRE%'
       OR UPPER(name) LIKE '%SÃO SILVESTRE%'
       OR sigla = 'VSS'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_vss_id IS NOT NULL THEN
        RAISE NOTICE 'Vinculando registros órfãos à empresa Viação São Silvestre (ID: %)', v_vss_id;

        -- 2. Veículos e Frotas
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
            UPDATE vehicles SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        -- 3. Funcionários
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
            UPDATE employees SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        -- 4. Almoxarifado / Estoque
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_items') THEN
            UPDATE stock_items SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_invoice_entries') THEN
            UPDATE stock_invoice_entries SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'material_requisitions') THEN
            UPDATE material_requisitions SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        -- 5. Ordens de Serviço e Manutenções
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fleet_work_orders') THEN
            UPDATE fleet_work_orders SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_maintenances') THEN
            UPDATE vehicle_maintenances SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_records') THEN
            UPDATE fuel_records SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tires') THEN
            UPDATE tires SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_batteries') THEN
            UPDATE vehicle_batteries SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_gate_checklists') THEN
            UPDATE vehicle_gate_checklists SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_inspections') THEN
            UPDATE vehicle_inspections SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_cleaning_orders') THEN
            UPDATE vehicle_cleaning_orders SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_documents') THEN
            UPDATE vehicle_documents SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        -- 6. Estrutura Operacional (Garagens, Postos, Unidades, Rotas, Escalas)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'garages') THEN
            UPDATE garages SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_posts') THEN
            UPDATE work_posts SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
            UPDATE units SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
            UPDATE routes SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
            UPDATE schedules SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_requests') THEN
            UPDATE purchase_requests SET company_id = v_vss_id WHERE company_id IS NULL;
        END IF;

        RAISE NOTICE 'Atualização de registros órfãos concluída com sucesso.';
    ELSE
        RAISE NOTICE 'Viação São Silvestre não localizada na tabela companies.';
    END IF;
END $$;
