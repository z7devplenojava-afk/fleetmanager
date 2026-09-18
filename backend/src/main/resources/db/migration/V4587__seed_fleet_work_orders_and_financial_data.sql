-- V4587__seed_fleet_work_orders_and_financial_data.sql
-- Seed de Ordens de Serviço (OS Frota), Contas a Pagar (Invoices) e Contas a Receber (Accounts Receivable)

DO $$
DECLARE
    v_company_id UUID;
    v_client_id UUID;
    v_unit_id UUID;
    v_supplier_id UUID;
    v_supplier_auto_id UUID;
    v_supplier_comb_id UUID;
    v_vehicle_1_id UUID;
    v_vehicle_2_id UUID;
    v_vehicle_3_id UUID;
    v_work_post_id UUID;
    v_os_1_id UUID;
    v_os_2_id UUID;
    v_os_3_id UUID;
    v_os_4_id UUID;
    v_os_5_id UUID;
BEGIN
    -- 1. Obter ou garantir uma Empresa Ativa
    SELECT id INTO v_company_id FROM companies WHERE status = 'ACTIVE' LIMIT 1;
    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM companies LIMIT 1;
    END IF;

    IF v_company_id IS NULL THEN
        v_company_id := gen_random_uuid();
        INSERT INTO companies (id, name, cnpj, sigla, status)
        VALUES (v_company_id, 'EMPRESA MATRIZ TRANSPORTE E SERVICOS', '11.222.333/0001-99', 'MTZ', 'ACTIVE')
        ON CONFLICT DO NOTHING;
        SELECT id INTO v_company_id FROM companies LIMIT 1;
    END IF;

    -- 2. Obter ou criar Unidade (Unit)
    SELECT id INTO v_unit_id FROM units LIMIT 1;
    IF v_unit_id IS NULL THEN
        v_unit_id := gen_random_uuid();
        INSERT INTO units (id, name, address, created_at, updated_at)
        VALUES (v_unit_id, 'Unidade Operacional Central', 'Av. Amazonas, 1000 - Centro, Contagem - MG', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING;
        SELECT id INTO v_unit_id FROM units LIMIT 1;
    END IF;

    -- 3. Obter ou criar Cliente (Client)
    SELECT id INTO v_client_id FROM clients WHERE company_id = v_company_id OR company_id IS NULL LIMIT 1;
    IF v_client_id IS NULL THEN
        v_client_id := gen_random_uuid();
        INSERT INTO clients (id, name, cnpj, email, phone, status, company_id, created_at, updated_at)
        VALUES (v_client_id, 'MINERAÇÃO & LOGÍSTICA VALE DO SOL S/A', '22.333.444/0001-55', 'contato@valedosol.com.br', '(31) 3456-7890', 'ACTIVE', v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (cnpj) DO NOTHING;
        SELECT id INTO v_client_id FROM clients WHERE cnpj = '22.333.444/0001-55' OR company_id = v_company_id LIMIT 1;
    END IF;

    -- 4. Obter ou criar Posto / Obra (WorkPost)
    SELECT id INTO v_work_post_id FROM work_posts WHERE client_id = v_client_id LIMIT 1;
    IF v_work_post_id IS NULL THEN
        v_work_post_id := gen_random_uuid();
        INSERT INTO work_posts (id, post_code, name, address, type, status, client_id, required_vigilantes, work_schedule, shift_start, shift_end, created_at, updated_at)
        VALUES (v_work_post_id, 'OBRA-CENTRAL-01', 'Obra Mineração Mina Norte', 'Rodovia BR-040 Km 520, Contagem - MG', 'POSTO_24H', 'ATIVO', v_client_id, 4, '12x36', '06:00:00', '18:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (post_code) DO NOTHING;
        SELECT id INTO v_work_post_id FROM work_posts WHERE post_code = 'OBRA-CENTRAL-01' LIMIT 1;
    END IF;

    -- 5. Obter ou criar Fornecedores (Suppliers)
    SELECT id INTO v_supplier_id FROM suppliers WHERE (company_id = v_company_id OR company_id IS NULL) AND is_active = true LIMIT 1;
    IF v_supplier_id IS NULL THEN
        v_supplier_id := gen_random_uuid();
        INSERT INTO suppliers (id, name, cnpj, email, phone, is_active, company_id, created_at, updated_at)
        VALUES (v_supplier_id, 'AUTO PEÇAS E COMPONENTES DIESEL LTDA', '33.444.555/0001-66', 'vendas@dieselpecas.com.br', '(31) 3399-1122', true, v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (cnpj) DO NOTHING;
        SELECT id INTO v_supplier_id FROM suppliers WHERE cnpj = '33.444.555/0001-66' LIMIT 1;
    END IF;

    v_supplier_auto_id := gen_random_uuid();
    INSERT INTO suppliers (id, name, cnpj, email, phone, is_active, company_id, created_at, updated_at)
    VALUES (v_supplier_auto_id, 'AUTO CENTER & OFICINA MECÂNICA ESPECIALIZADA LTDA', '44.555.666/0001-77', 'oficina@centraldiesel.com.br', '(31) 3388-2233', true, v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (cnpj) DO NOTHING;
    SELECT id INTO v_supplier_auto_id FROM suppliers WHERE cnpj = '44.555.666/0001-77' LIMIT 1;
    IF v_supplier_auto_id IS NULL THEN v_supplier_auto_id := v_supplier_id; END IF;

    v_supplier_comb_id := gen_random_uuid();
    INSERT INTO suppliers (id, name, cnpj, email, phone, is_active, company_id, created_at, updated_at)
    VALUES (v_supplier_comb_id, 'POSTO E DISTRIBUIDORA DE COMBUSTÍVEIS IPIRANGA S/A', '55.666.777/0001-88', 'combustivel@postoipiranga.com.br', '(31) 3377-3344', true, v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (cnpj) DO NOTHING;
    SELECT id INTO v_supplier_comb_id FROM suppliers WHERE cnpj = '55.666.777/0001-88' LIMIT 1;
    IF v_supplier_comb_id IS NULL THEN v_supplier_comb_id := v_supplier_id; END IF;

    -- 6. Obter ou criar Veículos
    SELECT id INTO v_vehicle_1_id FROM vehicles WHERE (company_id = v_company_id OR company_id IS NULL) AND deleted_at IS NULL LIMIT 1;
    IF v_vehicle_1_id IS NULL THEN
        v_vehicle_1_id := gen_random_uuid();
        INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, company_id, work_post_id, client_id, created_at, updated_at)
        VALUES (v_vehicle_1_id, 'FLX-1A23', 'VOLKSWAGEN', '17.230 OD Ônibus Urbano', 2023, 'DIESEL', 44, 85400, 'ACTIVE', 'BUS_URBAN', v_company_id, v_work_post_id, v_client_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (plate) DO NOTHING;
        SELECT id INTO v_vehicle_1_id FROM vehicles WHERE plate = 'FLX-1A23' LIMIT 1;
    END IF;

    SELECT id INTO v_vehicle_2_id FROM vehicles WHERE (company_id = v_company_id OR company_id IS NULL) AND id <> v_vehicle_1_id AND deleted_at IS NULL LIMIT 1;
    IF v_vehicle_2_id IS NULL THEN
        v_vehicle_2_id := gen_random_uuid();
        INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, company_id, work_post_id, client_id, created_at, updated_at)
        VALUES (v_vehicle_2_id, 'FLX-2B45', 'MERCEDES-BENZ', 'OF-1721 Bluetec 5 Fretamento', 2022, 'DIESEL', 46, 142300, 'ACTIVE', 'BUS_URBAN', v_company_id, v_work_post_id, v_client_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (plate) DO NOTHING;
        SELECT id INTO v_vehicle_2_id FROM vehicles WHERE plate = 'FLX-2B45' LIMIT 1;
        IF v_vehicle_2_id IS NULL THEN v_vehicle_2_id := v_vehicle_1_id; END IF;
    END IF;

    SELECT id INTO v_vehicle_3_id FROM vehicles WHERE (company_id = v_company_id OR company_id IS NULL) AND id NOT IN (v_vehicle_1_id, v_vehicle_2_id) AND deleted_at IS NULL LIMIT 1;
    IF v_vehicle_3_id IS NULL THEN
        v_vehicle_3_id := gen_random_uuid();
        INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, company_id, work_post_id, client_id, created_at, updated_at)
        VALUES (v_vehicle_3_id, 'FLX-3C67', 'MARCOPOLO / VOLVO', 'B270F Rodoviário Executivo', 2024, 'DIESEL', 50, 32100, 'ACTIVE', 'BUS_ROAD', v_company_id, v_work_post_id, v_client_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (plate) DO NOTHING;
        SELECT id INTO v_vehicle_3_id FROM vehicles WHERE plate = 'FLX-3C67' LIMIT 1;
        IF v_vehicle_3_id IS NULL THEN v_vehicle_3_id := v_vehicle_1_id; END IF;
    END IF;

    -- =========================================================================
    -- 7. SEED: ORDENS DE SERVIÇO DE FROTA (fleet_work_orders)
    -- =========================================================================

    -- OS 1: Manutenção Preventiva Concluída (Troca de óleo, filtros, correias)
    SELECT id INTO v_os_1_id FROM fleet_work_orders WHERE os_number = 'OS-2026-000101' LIMIT 1;
    IF v_os_1_id IS NULL THEN
        v_os_1_id := gen_random_uuid();
        INSERT INTO fleet_work_orders (
            id, os_number, vehicle_id, maintenance_type, status, priority, labor_type,
            planned_date, start_date, completion_date, stop_date, stop_time, exit_date, exit_time,
            odometer_in, odometer_out, stop_reason, labor_cost, parts_cost, total_cost,
            mechanic_name, anomalies_description, maintenance_performed, work_post_id, client_id,
            company_id, created_at, updated_at
        ) VALUES (
            v_os_1_id, 'OS-2026-000101', v_vehicle_1_id, 'PREVENTIVA', 'COMPLETED', 'MEDIUM', 'INTERNAL',
            CURRENT_DATE - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '14 days',
            CURRENT_DATE - INTERVAL '15 days', '08:00', CURRENT_DATE - INTERVAL '14 days', '17:30',
            84000, 84000, 'Revisão preventiva periódica de 80.000 KM', 650.00, 1850.00, 2500.00,
            'Carlos Eduardo (Mecânico Chefe)', 'Filtro de combustível com saturação e correia com desgaste natural.',
            'Substituição do óleo do motor 15W40, troca de filtros de óleo, ar e combustível, substituição de correias de acessórios.',
            v_work_post_id, v_client_id, v_company_id, CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '14 days'
        ) ON CONFLICT DO NOTHING;

        INSERT INTO work_order_items (id, work_order_id, description, type, quantity, unit_price, total_price, provider, created_at)
        VALUES
            (gen_random_uuid(), v_os_1_id, 'Óleo Motor 15W40 Diesel (Balde 20L)', 'PART', 2.00, 450.00, 900.00, 'Diesel Peças', CURRENT_TIMESTAMP - INTERVAL '15 days'),
            (gen_random_uuid(), v_os_1_id, 'Filtro de Combustível Primário e Secundário', 'PART', 1.00, 380.00, 380.00, 'Diesel Peças', CURRENT_TIMESTAMP - INTERVAL '15 days'),
            (gen_random_uuid(), v_os_1_id, 'Filtro de Ar Motor Pesado', 'PART', 1.00, 570.00, 570.00, 'Diesel Peças', CURRENT_TIMESTAMP - INTERVAL '15 days'),
            (gen_random_uuid(), v_os_1_id, 'Mão de Obra Mecânica Preventiva Completa', 'LABOR', 1.00, 650.00, 650.00, 'Oficina Interna', CURRENT_TIMESTAMP - INTERVAL '15 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- OS 2: Manutenção Corretiva em Andamento (Sistema de Freios e Cuícas)
    SELECT id INTO v_os_2_id FROM fleet_work_orders WHERE os_number = 'OS-2026-000102' LIMIT 1;
    IF v_os_2_id IS NULL THEN
        v_os_2_id := gen_random_uuid();
        INSERT INTO fleet_work_orders (
            id, os_number, vehicle_id, maintenance_type, status, priority, labor_type,
            planned_date, start_date, stop_date, stop_time,
            odometer_in, stop_reason, labor_cost, parts_cost, total_cost,
            mechanic_name, anomalies_description, maintenance_performed, work_post_id, client_id,
            company_id, created_at, updated_at
        ) VALUES (
            v_os_2_id, 'OS-2026-000102', v_vehicle_2_id, 'CORRETIVA', 'IN_PROGRESS', 'HIGH', 'EXTERNAL',
            CURRENT_DATE - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days',
            CURRENT_DATE - INTERVAL '2 days', '14:20',
            142100, 'Chiado excessivo e perda de pressão no freio traseiro direito', 800.00, 2400.00, 3200.00,
            'Oficina Especializada Freios Brasil', 'Lonas de freio gastas e vazamento na cuíca dupla traseira.',
            'Desmontagem do cubo, substituição das lonas de freio, retífica de tambores e troca da cuíca de freio.',
            v_work_post_id, v_client_id, v_company_id, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;

        INSERT INTO work_order_items (id, work_order_id, description, type, quantity, unit_price, total_price, provider, created_at)
        VALUES
            (gen_random_uuid(), v_os_2_id, 'Jogo de Lonas de Freio Traseiras', 'PART', 2.00, 650.00, 1300.00, 'Freios Brasil', CURRENT_TIMESTAMP - INTERVAL '2 days'),
            (gen_random_uuid(), v_os_2_id, 'Cuíca Dupla de Freio Spring Brake 24x30', 'PART', 1.00, 1100.00, 1100.00, 'Freios Brasil', CURRENT_TIMESTAMP - INTERVAL '2 days'),
            (gen_random_uuid(), v_os_2_id, 'Serviço de Retífica de Tambores e Troca de Lonas', 'LABOR', 1.00, 800.00, 800.00, 'Oficina Externa', CURRENT_TIMESTAMP - INTERVAL '2 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- OS 3: Manutenção Aberta / Aguardando Peças (Sistema de Suspensão e Feixe de Molas)
    SELECT id INTO v_os_3_id FROM fleet_work_orders WHERE os_number = 'OS-2026-000103' LIMIT 1;
    IF v_os_3_id IS NULL THEN
        v_os_3_id := gen_random_uuid();
        INSERT INTO fleet_work_orders (
            id, os_number, vehicle_id, maintenance_type, status, priority, labor_type,
            planned_date, stop_date, stop_time,
            odometer_in, stop_reason, labor_cost, parts_cost, total_cost,
            mechanic_name, anomalies_description, work_post_id, client_id,
            company_id, created_at, updated_at
        ) VALUES (
            v_os_3_id, 'OS-2026-000103', v_vehicle_3_id, 'CORRETIVA', 'WAITING_PARTS', 'URGENT', 'INTERNAL',
            CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day', '09:15',
            32100, 'Lâmina do feixe de molas dianteiro esquerdo quebrada em trajeto', 500.00, 1750.00, 2250.00,
            'Marcos Vinicius (Mecânico)', 'Ruído e desnivelamento na dianteira esquerda do veículo.',
            v_work_post_id, v_client_id, v_company_id, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;

        INSERT INTO work_order_items (id, work_order_id, description, type, quantity, unit_price, total_price, provider, created_at)
        VALUES
            (gen_random_uuid(), v_os_3_id, 'Lâmina Mestra Feixe de Molas Dianteiro', 'PART', 1.00, 1250.00, 1250.00, 'Molas e Eixos MG', CURRENT_TIMESTAMP - INTERVAL '1 day'),
            (gen_random_uuid(), v_os_3_id, 'Kit de Buchas e Pinos de Centro', 'PART', 2.00, 250.00, 500.00, 'Molas e Eixos MG', CURRENT_TIMESTAMP - INTERVAL '1 day'),
            (gen_random_uuid(), v_os_3_id, 'Mão de Obra Montagem de Feixe de Molas', 'LABOR', 1.00, 500.00, 500.00, 'Oficina Interna', CURRENT_TIMESTAMP - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
    END IF;

    -- OS 4: Manutenção Preventiva Programada (Aberto / Agendado)
    SELECT id INTO v_os_4_id FROM fleet_work_orders WHERE os_number = 'OS-2026-000104' LIMIT 1;
    IF v_os_4_id IS NULL THEN
        v_os_4_id := gen_random_uuid();
        INSERT INTO fleet_work_orders (
            id, os_number, vehicle_id, maintenance_type, status, priority, labor_type,
            planned_date, odometer_in, stop_reason, labor_cost, parts_cost, total_cost,
            mechanic_name, anomalies_description, work_post_id, client_id,
            company_id, created_at, updated_at
        ) VALUES (
            v_os_4_id, 'OS-2026-000104', v_vehicle_1_id, 'PREVENTIVA', 'OPEN', 'LOW', 'INTERNAL',
            CURRENT_DATE + INTERVAL '5 days', 85400, 'Inspeção Semestral do Sistema de Ar Condicionado e Ventilação', 350.00, 600.00, 950.00,
            'Técnico em Climatização', 'Higienização, troca de filtros de cabine e verificação de gás refrigerante R134a.',
            v_work_post_id, v_client_id, v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT DO NOTHING;
    END IF;

    -- OS 5: Inspeção Elétrica e Iluminação (Concluída)
    SELECT id INTO v_os_5_id FROM fleet_work_orders WHERE os_number = 'OS-2026-000105' LIMIT 1;
    IF v_os_5_id IS NULL THEN
        v_os_5_id := gen_random_uuid();
        INSERT INTO fleet_work_orders (
            id, os_number, vehicle_id, maintenance_type, status, priority, labor_type,
            planned_date, start_date, completion_date, stop_date, stop_time, exit_date, exit_time,
            odometer_in, odometer_out, stop_reason, labor_cost, parts_cost, total_cost,
            mechanic_name, anomalies_description, maintenance_performed, work_post_id, client_id,
            company_id, created_at, updated_at
        ) VALUES (
            v_os_5_id, 'OS-2026-000105', v_vehicle_2_id, 'INSPECAO', 'COMPLETED', 'MEDIUM', 'INTERNAL',
            CURRENT_DATE - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '4 hours',
            CURRENT_DATE - INTERVAL '7 days', '10:00', CURRENT_DATE - INTERVAL '7 days', '14:00',
            141900, 141900, 'Farol dianteiro esquerdo queimado e iluminação do salão oscilando', 200.00, 380.00, 580.00,
            'Eletricista Auto Diesel', 'Lâmpada H7 queimada e relé auxiliar com mau contato.',
            'Troca das lâmpadas dos faróis dianteiros e substituição do relé de proteção.',
            v_work_post_id, v_client_id, v_company_id, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days'
        ) ON CONFLICT DO NOTHING;
    END IF;


    -- =========================================================================
    -- 8. SEED: CONTAS A PAGAR (invoices)
    -- =========================================================================

    -- 1. Fornecedor de Peças (Pendente - Vencendo em breve)
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = 'NF-2026-8834') THEN
        INSERT INTO invoices (
            id, invoice_number, description, amount, type, status, due_date, issue_date,
            category, cost_center, company_id, unit_id, supplier_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'NF-2026-8834', 'Aquisição de peças para manutenção preventiva da frota (Filtros e Óleos)',
            1850.00, 'VARIAVEL', 'PENDENTE', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE - INTERVAL '5 days',
            'MANUTENCAO', 'CENTRO DE CUSTO - MANUTENÇÃO DE FROTA', v_company_id, v_unit_id, v_supplier_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    -- 2. Combustível Diesel Mensal (Pendente - Vence hoje)
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = 'NF-2026-9041') THEN
        INSERT INTO invoices (
            id, invoice_number, description, amount, type, status, due_date, issue_date,
            category, cost_center, company_id, unit_id, supplier_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'NF-2026-9041', 'Abastecimento Diesel S10 Quinzenal - Posto Conveniado Rodoanel',
            14850.00, 'VARIAVEL', 'PENDENTE', CURRENT_DATE, CURRENT_DATE - INTERVAL '15 days',
            'COMBUSTIVEL', 'CENTRO DE CUSTO - OPERAÇÃO TRANSPORTE', v_company_id, v_unit_id, v_supplier_comb_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    -- 3. Seguro Obrigatório e Frota (Pago)
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = 'SEG-2026-004') THEN
        INSERT INTO invoices (
            id, invoice_number, description, amount, type, status, due_date, issue_date, payment_date,
            category, cost_center, company_id, unit_id, supplier_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'SEG-2026-004', 'Apólice de Seguro Coletivo de Casco e Responsabilidade Civil Frota',
            6420.00, 'FIXA', 'PAGA', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '10 days',
            'SEGUROS', 'CENTRO DE CUSTO - ADMINISTRATIVO', v_company_id, v_unit_id, v_supplier_id, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
        );
    END IF;

    -- 4. Serviços de Oficina Externa e Retífica (Atrasado)
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = 'NF-2026-8120') THEN
        INSERT INTO invoices (
            id, invoice_number, description, amount, type, status, due_date, issue_date,
            category, cost_center, company_id, unit_id, supplier_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'NF-2026-8120', 'Serviço de torno mecânico, alinhamento a laser e retífica de tambores',
            3200.00, 'VARIAVEL', 'PENDENTE', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '20 days',
            'MANUTENCAO', 'CENTRO DE CUSTO - MANUTENÇÃO DE FROTA', v_company_id, v_unit_id, v_supplier_auto_id, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP
        );
    END IF;

    -- 5. Licenciamento e IPVA Parcelado (Pendente a Vencer)
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = 'IPVA-2026-PARC3') THEN
        INSERT INTO invoices (
            id, invoice_number, description, amount, type, status, due_date, issue_date,
            category, cost_center, company_id, unit_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'IPVA-2026-PARC3', 'IPVA e Taxas de Licenciamento Anual - Veículos Operacionais Parcela 3/5',
            8950.00, 'FIXA', 'PENDENTE', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days',
            'TAXAS_IMPOSTOS', 'CENTRO DE CUSTO - ADMINISTRATIVO', v_company_id, v_unit_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    -- 6. Fornecimento de Pneus Novos (Pendente a Vencer)
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_number = 'NF-2026-9502') THEN
        INSERT INTO invoices (
            id, invoice_number, description, amount, type, status, due_date, issue_date,
            category, cost_center, company_id, unit_id, supplier_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'NF-2026-9502', 'Aquisição de 8 pneus radiais 295/80R22.5 Michelin para substituição preventiva',
            17600.00, 'VARIAVEL', 'PENDENTE', CURRENT_DATE + INTERVAL '28 days', CURRENT_DATE - INTERVAL '2 days',
            'PNEUS', 'CENTRO DE CUSTO - MANUTENÇÃO DE FROTA', v_company_id, v_unit_id, v_supplier_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;


    -- =========================================================================
    -- 9. SEED: CONTAS A RECEBER (accounts_receivable)
    -- =========================================================================

    -- 1. Faturamento de Medição Mensal Fretamento (Pendente a Vencer)
    IF NOT EXISTS (SELECT 1 FROM accounts_receivable WHERE invoice_number = 'REC-2026-081') THEN
        INSERT INTO accounts_receivable (
            id, invoice_number, measurement_number, description, amount, amount_paid,
            issue_date, due_date, status, category, payment_method,
            client_id, unit_id, work_post_id, centro_custo, company_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'REC-2026-081', 'MED-2026-02', 'Faturamento mensal de transporte de funcionários - Obra Mina Norte',
            48500.00, 0.00,
            CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'PENDING', 'SERVICE', 'BOLETO',
            v_client_id, v_unit_id, v_work_post_id, 'RECEITAS DE FRETAMENTO CONTÍNUO', v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

    -- 2. Faturamento de Locação de Ônibus com Motorista (Recebido / Pago)
    IF NOT EXISTS (SELECT 1 FROM accounts_receivable WHERE invoice_number = 'REC-2026-072') THEN
        INSERT INTO accounts_receivable (
            id, invoice_number, measurement_number, description, amount, amount_paid,
            issue_date, due_date, payment_date, status, category, payment_method,
            client_id, unit_id, work_post_id, centro_custo, company_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'REC-2026-072', 'MED-2026-01', 'Fretamento eventual executivo e transporte de equipes técnicas',
            26800.00, 26800.00,
            CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '6 days', 'PAID', 'SERVICE', 'TRANSFER',
            v_client_id, v_unit_id, v_work_post_id, 'RECEITAS DE LOCAÇÃO E FRETAMENTO', v_company_id, CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP
        );
    END IF;

    -- 3. Fatura de Prestação de Serviços em Atraso (Vencida)
    IF NOT EXISTS (SELECT 1 FROM accounts_receivable WHERE invoice_number = 'REC-2026-065') THEN
        INSERT INTO accounts_receivable (
            id, invoice_number, measurement_number, description, amount, amount_paid,
            issue_date, due_date, status, category, payment_method,
            client_id, unit_id, work_post_id, centro_custo, company_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'REC-2026-065', 'MED-2025-12', 'Faturamento de serviços operacionais complementares - Dezembro/2025',
            18250.00, 0.00,
            CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '15 days', 'OVERDUE', 'SERVICE', 'BOLETO',
            v_client_id, v_unit_id, v_work_post_id, 'RECEITAS DE CONTRATOS', v_company_id, CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP
        );
    END IF;

    -- 4. Faturamento Parcialmente Recebido (Parcela paga com saldo pendente)
    IF NOT EXISTS (SELECT 1 FROM accounts_receivable WHERE invoice_number = 'REC-2026-088') THEN
        INSERT INTO accounts_receivable (
            id, invoice_number, measurement_number, description, amount, amount_paid,
            issue_date, due_date, payment_date, status, category, payment_method,
            client_id, unit_id, work_post_id, centro_custo, company_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'REC-2026-088', 'MED-2026-02-B', 'Fretamento rota especial de turno noturno e fins de semana',
            32000.00, 16000.00,
            CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '18 days', CURRENT_DATE - INTERVAL '2 days', 'PARTIAL', 'SERVICE', 'PIX',
            v_client_id, v_unit_id, v_work_post_id, 'RECEITAS DE FRETAMENTO CONTÍNUO', v_company_id, CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP
        );
    END IF;

    -- 5. Contrato de Manutenção e Gestão de Frotas Terceirizadas (Pendente a Vencer)
    IF NOT EXISTS (SELECT 1 FROM accounts_receivable WHERE invoice_number = 'REC-2026-094') THEN
        INSERT INTO accounts_receivable (
            id, invoice_number, description, amount, amount_paid,
            issue_date, due_date, status, category, payment_method,
            client_id, unit_id, work_post_id, centro_custo, company_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), 'REC-2026-094', 'Gestão integrada de frota e suporte logístico dedicado',
            54100.00, 0.00,
            CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '25 days', 'PENDING', 'SERVICE', 'BOLETO',
            v_client_id, v_unit_id, v_work_post_id, 'RECEITAS DE GESTÃO DE FROTA', v_company_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
    END IF;

END $$;
