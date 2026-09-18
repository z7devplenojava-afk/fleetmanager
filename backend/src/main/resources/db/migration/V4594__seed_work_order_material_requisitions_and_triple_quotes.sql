-- Migration: V4594__seed_work_order_material_requisitions_and_triple_quotes.sql
-- Description: Seed de Ordem de Serviço, Requisição de Material, Comparativo de 3 Cotações e Ordem de Compra Programada no Financeiro

DO $$
DECLARE
    v_company_id UUID;
    v_vehicle_id UUID;
    v_work_post_id UUID;
    v_client_id UUID;
    v_user_id UUID;
    v_os_id UUID;
    v_req_id UUID;
    v_comparison_id UUID;
    v_opt_rocha_id UUID;
    v_opt_bhm_id UUID;
    v_opt_auto_id UUID;
    v_po_id UUID;
BEGIN
    -- 1. Obter Empresa
    SELECT id INTO v_company_id FROM companies WHERE status = 'ACTIVE' LIMIT 1;
    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM companies LIMIT 1;
    END IF;

    -- 2. Obter Veículo
    SELECT id, work_post_id, client_id INTO v_vehicle_id, v_work_post_id, v_client_id 
    FROM vehicles 
    WHERE (company_id = v_company_id OR company_id IS NULL) AND deleted_at IS NULL 
    LIMIT 1;

    -- 3. Obter Usuário
    SELECT id INTO v_user_id FROM users WHERE username = 'admin' OR email LIKE '%admin%' LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users LIMIT 1;
    END IF;

    -- 4. Garantir Fornecedores Cadastrados
    INSERT INTO suppliers (id, name, trade_name, cnpj, email, phone, contact_name, is_active, company_id, created_at, updated_at)
    VALUES (gen_random_uuid(), 'ROCHA DISTRIBUIDORA E COMERCIAL LTDA', 'Rocha Peças Diesel', '05.845.228/0001-44', 'vendas@rochadiesel.com.br', '(31) 3398-1000', 'Paulo Henrique', true, v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    INSERT INTO suppliers (id, name, trade_name, cnpj, email, phone, contact_name, is_active, company_id, created_at, updated_at)
    VALUES (gen_random_uuid(), 'BHM DIESEL LIMITADA', 'BHM Distribuidora Diesel', '14.321.987/0001-33', 'comercial@bhmdiesel.com.br', '(31) 3212-4500', 'Marcos Vinicius', true, v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    INSERT INTO suppliers (id, name, trade_name, cnpj, email, phone, contact_name, is_active, company_id, created_at, updated_at)
    VALUES (gen_random_uuid(), 'AUTO PECAS E COMPONENTES DIESEL BRASIL LTDA', 'Auto Peças Brasil', '33.444.555/0001-66', 'atendimento@pecasdiesel.com.br', '(31) 3399-1122', 'Carlos Eduardo', true, v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- 5. Inserir Ordem de Serviço (Fleet Work Order)
    SELECT id INTO v_os_id FROM fleet_work_orders WHERE os_number = 'OS-2026-000105' LIMIT 1;
    IF v_os_id IS NULL THEN
        v_os_id := gen_random_uuid();
        INSERT INTO fleet_work_orders (
            id, os_number, vehicle_id, maintenance_type, status, priority, labor_type,
            planned_date, start_date, stop_date, stop_time,
            odometer_in, stop_reason, labor_cost, parts_cost, total_cost,
            mechanic_name, anomalies_description, maintenance_performed, work_post_id, client_id,
            company_id, created_at, updated_at
        ) VALUES (
            v_os_id, 'OS-2026-000105', v_vehicle_id, 'CORRETIVA', 'IN_PROGRESS', 'HIGH', 'INTERNAL',
            CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day',
            CURRENT_DATE - INTERVAL '1 day', '08:30',
            86200, 'Vazamento contínuo de ar na válvula reguladora e ruído anormal nas cuícas traseiras.',
            850.00, 3840.00, 4690.00,
            'Carlos Eduardo (Mecânico Chefe)',
            'Válvula Reguladora de Pressão APS Wabco com perda de estanqueidade e cuícas traseiras com desgaste interno.',
            'Desmontagem do bloco pneumático, substituição da válvula reguladora de pressão Wabco, troca das cuícas de freio e testes de pressurização a 10 bar.',
            v_work_post_id, v_client_id, v_company_id, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;

        -- Itens da O.S.
        INSERT INTO work_order_items (id, work_order_id, description, type, quantity, unit_price, total_price, provider, created_at)
        VALUES
            (gen_random_uuid(), v_os_id, 'Válvula Reguladora de Pressão APS Wabco 17.230', 'PART', 1.00, 2150.00, 2150.00, 'Rocha Peças Diesel', CURRENT_TIMESTAMP - INTERVAL '1 day'),
            (gen_random_uuid(), v_os_id, 'Cuíca de Freio Traseira Spring Brake 24x30', 'PART', 2.00, 650.00, 1300.00, 'Rocha Peças Diesel', CURRENT_TIMESTAMP - INTERVAL '1 day'),
            (gen_random_uuid(), v_os_id, 'Kit Conexões e Mangueiras Pneumáticas Alta Pressão', 'PART', 1.00, 390.00, 390.00, 'Rocha Peças Diesel', CURRENT_TIMESTAMP - INTERVAL '1 day'),
            (gen_random_uuid(), v_os_id, 'Serviço de Montagem, Calibração Pneumática e Sangria', 'LABOR', 1.00, 850.00, 850.00, 'Oficina Interna', CURRENT_TIMESTAMP - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 6. Inserir Requisição de Material no Almoxarifado
    SELECT id INTO v_req_id FROM material_requisitions WHERE requisition_number = 'REQ-2026-000105' LIMIT 1;
    IF v_req_id IS NULL THEN
        v_req_id := gen_random_uuid();
        INSERT INTO material_requisitions (
            id, company_id, requisition_number, work_order_id, vehicle_id,
            item_name, item_code, quantity, unit, urgency,
            justification, requester_id, requester_name, status,
            manager_approval_id, manager_approval_name, manager_approval_date,
            created_at, updated_at
        ) VALUES (
            v_req_id, v_company_id, 'REQ-2026-000105', v_os_id, v_vehicle_id,
            'Kit Válvula Reguladora Wabco + Cuícas de Freio 24x30', 'PNEUM-00105', 1.00, 'CJ', 'NORMAL',
            'Peças para execução da Ordem de Serviço OS-2026-000105 referente a vazamento pneumático nos freios.',
            v_user_id, 'Jose Mario Ramos', 'OC_GENERATED',
            v_user_id, 'Jose Mario Ramos', CURRENT_TIMESTAMP - INTERVAL '1 day',
            CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;
    END IF;

    -- 7. Inserir Comparativo de 3 Cotações
    SELECT id INTO v_comparison_id FROM procurement_quote_comparisons WHERE comparison_number = 'COT-2026-000105' LIMIT 1;
    IF v_comparison_id IS NULL THEN
        v_comparison_id := gen_random_uuid();
        INSERT INTO procurement_quote_comparisons (
            id, company_id, requisition_id, comparison_number, status,
            system_recommendation_reason, approved_by_id, approved_by_name, approved_at,
            created_at, updated_at
        ) VALUES (
            v_comparison_id, v_company_id, v_req_id, 'COT-2026-000105', 'APPROVED',
            'Fornecedor Rocha Peças Diesel oferece o menor preço global (R$ 3.840,00), pronta entrega (1 dia útil), garantia estendida de 12 meses e faturamento 30/60 dias.',
            v_user_id, 'Jose Mario Ramos', CURRENT_TIMESTAMP - INTERVAL '1 day',
            CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;

        -- Opção 1: Rocha Peças Diesel (Vencedora)
        v_opt_rocha_id := gen_random_uuid();
        INSERT INTO procurement_quote_options (
            id, comparison_id, supplier_name, supplier_cnpj, supplier_contact, supplier_phone,
            unit_price, total_price, payment_terms, payment_term_days, delivery_time_days,
            shipping_cost, warranty_months, is_winner, notes, created_at
        ) VALUES (
            v_opt_rocha_id, v_comparison_id, 'Rocha Distribuidora e Comercial Ltda (Rocha Peças Diesel)',
            '05.845.228/0001-44', 'Paulo Henrique (Vendedor)', '(31) 3398-1000',
            3840.00, 3840.00, '30/60 DIAS', 60, 1,
            0.00, 12, true,
            'Orçamento nº 0104/017453. Itens originais Wabco com entrega em 24h na garagem matriz.',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        ) ON CONFLICT DO NOTHING;

        -- Opção 2: BHM Diesel Limitada
        v_opt_bhm_id := gen_random_uuid();
        INSERT INTO procurement_quote_options (
            id, comparison_id, supplier_name, supplier_cnpj, supplier_contact, supplier_phone,
            unit_price, total_price, payment_terms, payment_term_days, delivery_time_days,
            shipping_cost, warranty_months, is_winner, notes, created_at
        ) VALUES (
            v_opt_bhm_id, v_comparison_id, 'BHM Diesel Limitada',
            '14.321.987/0001-33', 'Marcos Vinicius (Atendente)', '(31) 3212-4500',
            4150.00, 4150.00, '30 DIAS', 30, 3,
            80.00, 6, false,
            'Orçamento nº 677370. Frete adicional de R$ 80,00 e prazo de 3 dias úteis.',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        ) ON CONFLICT DO NOTHING;

        -- Opção 3: Auto Peças & Componentes Diesel Brasil Ltda
        v_opt_auto_id := gen_random_uuid();
        INSERT INTO procurement_quote_options (
            id, comparison_id, supplier_name, supplier_cnpj, supplier_contact, supplier_phone,
            unit_price, total_price, payment_terms, payment_term_days, delivery_time_days,
            shipping_cost, warranty_months, is_winner, notes, created_at
        ) VALUES (
            v_opt_auto_id, v_comparison_id, 'Auto Peças & Componentes Diesel Brasil Ltda',
            '33.444.555/0001-66', 'Carlos Eduardo (Comercial)', '(31) 3399-1122',
            4420.00, 4420.00, 'À VISTA', 0, 2,
            50.00, 6, false,
            'Orçamento nº 08924. Preço global superior e exigência de pagamento antecipado.',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        ) ON CONFLICT DO NOTHING;

        -- Atualiza referências da opção vencedora no comparativo
        UPDATE procurement_quote_comparisons
        SET chosen_option_id = v_opt_rocha_id,
            system_recommended_option_id = v_opt_rocha_id
        WHERE id = v_comparison_id;
    END IF;

    -- 8. Inserir Ordem de Compra (OC) Programada para o Financeiro
    SELECT id INTO v_po_id FROM procurement_purchase_orders WHERE oc_number = 'OC-2026-000105' LIMIT 1;
    IF v_po_id IS NULL THEN
        v_po_id := gen_random_uuid();
        INSERT INTO procurement_purchase_orders (
            id, company_id, oc_number, requisition_id, comparison_id, winning_quote_option_id,
            supplier_name, supplier_cnpj, supplier_contact, supplier_phone,
            item_name, item_code, quantity, unit_price, total_amount, payment_terms,
            delivery_estimated_date, urgency, justification, status,
            financial_approved_by_id, financial_approved_by_name, financial_approved_at,
            financial_notes,
            payment_method, installments_count, card_number, card_flag, payment_reference,
            payment_scheduled_date, payment_due_date, payment_status, installment_details,
            financial_programmed_by_id, financial_programmed_by_name, financial_programmed_at,
            created_by_id, created_by_name, created_at, updated_at
        ) VALUES (
            v_po_id, v_company_id, 'OC-2026-000105', v_req_id, v_comparison_id, v_opt_rocha_id,
            'Rocha Distribuidora e Comercial Ltda (Rocha Peças Diesel)', '05.845.228/0001-44', 'Paulo Henrique', '(31) 3398-1000',
            'Kit Válvula Reguladora Wabco + Cuícas de Freio 24x30', 'PNEUM-00105', 1.00, 3840.00, 3840.00, '30/60 DIAS',
            CURRENT_DATE + INTERVAL '1 day', 'NORMAL',
            'Aquisição aprovada via Comparativo de 3 Cotações COT-2026-000105 para atender O.S. OS-2026-000105.',
            'FINANCIAL_APPROVED',
            v_user_id, 'Jose Mario Ramos', CURRENT_TIMESTAMP - INTERVAL '1 day',
            'Ordem de compra autorizada pela diretoria operacional com faturamento programado no cartão corporativo.',
            'CREDIT_CARD', 2, '**** **** **** 8421', 'MASTERCARD EMPRESARIAL', 'Doc 0104/017453 - Rocha Diesel 2x',
            CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '33 days', 'PROGRAMMED',
            'Parcela 1/2: R$ 1.920,00 (Venc: 30 dias) | Parcela 2/2: R$ 1.920,00 (Venc: 60 dias) - Cartão Corporativo Final 8421',
            v_user_id, 'Jose Mario Ramos', CURRENT_TIMESTAMP - INTERVAL '1 day',
            v_user_id, 'Jose Mario Ramos', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;
    END IF;

END $$;
