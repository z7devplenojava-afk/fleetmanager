-- =====================================================================
-- V4599: Seed de Gestão de Garagens, Pátios e Alocação de Veículos
-- Cria garagens operacionais realistas, aloca veículos existentes e novos,
-- insere registros de manutenção, tempos de permanência e histórico.
-- =====================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_emp_1_id UUID;
    v_emp_1_name VARCHAR(200);
    v_emp_1_phone VARCHAR(30);
    v_emp_2_id UUID;
    v_emp_2_name VARCHAR(200);
    v_emp_2_phone VARCHAR(30);
    v_emp_3_id UUID;
    v_emp_3_name VARCHAR(200);
    v_emp_3_phone VARCHAR(30);
    v_emp_4_id UUID;
    v_emp_4_name VARCHAR(200);
    v_emp_4_phone VARCHAR(30);

    v_garage_central_id UUID;
    v_garage_norte_id UUID;
    v_garage_sul_id UUID;
    v_garage_leste_id UUID;

    v_veh_rec RECORD;
    v_veh_count INT := 0;
BEGIN
    -- 1. Obter Empresa Ativa
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

    -- 2. Obter ou definir dados de Responsáveis (Funcionários)
    SELECT id, name, phone INTO v_emp_1_id, v_emp_1_name, v_emp_1_phone 
    FROM employees WHERE (company_id = v_company_id OR company_id IS NULL) LIMIT 1;
    IF v_emp_1_name IS NULL THEN
        v_emp_1_name := 'Carlos Henrique de Souza';
        v_emp_1_phone := '(11) 98765-4321';
    END IF;

    SELECT id, name, phone INTO v_emp_2_id, v_emp_2_name, v_emp_2_phone 
    FROM employees WHERE (company_id = v_company_id OR company_id IS NULL) AND id <> v_emp_1_id LIMIT 1;
    IF v_emp_2_name IS NULL THEN
        v_emp_2_name := 'Marcos Antônio Silveira';
        v_emp_2_phone := '(31) 99888-7711';
    END IF;

    SELECT id, name, phone INTO v_emp_3_id, v_emp_3_name, v_emp_3_phone 
    FROM employees WHERE (company_id = v_company_id OR company_id IS NULL) AND id NOT IN (v_emp_1_id, v_emp_2_id) LIMIT 1;
    IF v_emp_3_name IS NULL THEN
        v_emp_3_name := 'Roberto Fernandes Lima';
        v_emp_3_phone := '(11) 97123-8899';
    END IF;

    SELECT id, name, phone INTO v_emp_4_id, v_emp_4_name, v_emp_4_phone 
    FROM employees WHERE (company_id = v_company_id OR company_id IS NULL) AND id NOT IN (v_emp_1_id, v_emp_2_id, v_emp_3_id) LIMIT 1;
    IF v_emp_4_name IS NULL THEN
        v_emp_4_name := 'Fernando Dias Nogueira';
        v_emp_4_phone := '(21) 98222-3344';
    END IF;

    -- 3. Criar ou Obter as 4 Garagens / Pátios Principais
    -- Garagem 1: Pátio Central - Matriz
    SELECT id INTO v_garage_central_id FROM garages WHERE company_id = v_company_id AND name ILIKE '%Pátio Central%' LIMIT 1;
    IF v_garage_central_id IS NULL THEN
        v_garage_central_id := gen_random_uuid();
        INSERT INTO garages (id, name, address, responsible_employee_id, responsible_name, responsible_phone, capacity, notes, company_id, active, created_at, updated_at)
        VALUES (
            v_garage_central_id,
            'Pátio Central - Matriz Paulínia',
            'Av. José Paulino, 2500 - Distrito Industrial, Paulínia - SP',
            v_emp_1_id,
            v_emp_1_name,
            v_emp_1_phone,
            35,
            'Base principal com lavador automático, abastecimento próprio e portaria 24h.',
            v_company_id,
            TRUE,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE garages 
        SET capacity = 35, address = 'Av. José Paulino, 2500 - Distrito Industrial, Paulínia - SP',
            responsible_name = v_emp_1_name, responsible_phone = v_emp_1_phone
        WHERE id = v_garage_central_id;
    END IF;

    -- Garagem 2: Pátio Operacional Norte / Mina
    SELECT id INTO v_garage_norte_id FROM garages WHERE company_id = v_company_id AND name ILIKE '%Pátio Norte%' LIMIT 1;
    IF v_garage_norte_id IS NULL THEN
        v_garage_norte_id := gen_random_uuid();
        INSERT INTO garages (id, name, address, responsible_employee_id, responsible_name, responsible_phone, capacity, notes, company_id, active, created_at, updated_at)
        VALUES (
            v_garage_norte_id,
            'Pátio Norte - Base Mina do Sol',
            'Rodovia BR-381, Km 420 - Trevo de Apoio, Nova Lima - MG',
            v_emp_2_id,
            v_emp_2_name,
            v_emp_2_phone,
            20,
            'Ponto de apoio e pernoite para operações de transporte de turno da mineração.',
            v_company_id,
            TRUE,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE garages 
        SET capacity = 20, address = 'Rodovia BR-381, Km 420 - Trevo de Apoio, Nova Lima - MG',
            responsible_name = v_emp_2_name, responsible_phone = v_emp_2_phone
        WHERE id = v_garage_norte_id;
    END IF;

    -- Garagem 3: Base de Apoio & Manutenção Pesada Sul
    SELECT id INTO v_garage_sul_id FROM garages WHERE company_id = v_company_id AND name ILIKE '%Manutenção Sul%' LIMIT 1;
    IF v_garage_sul_id IS NULL THEN
        v_garage_sul_id := gen_random_uuid();
        INSERT INTO garages (id, name, address, responsible_employee_id, responsible_name, responsible_phone, capacity, notes, company_id, active, created_at, updated_at)
        VALUES (
            v_garage_sul_id,
            'Base de Apoio & Oficina Sul',
            'Rua das Oficinas Mecânicas, 380 - Parque Industrial, Betim - MG',
            v_emp_3_id,
            v_emp_3_name,
            v_emp_3_phone,
            12,
            'Pátio especializado em manutenção pesada, suspensão, freios e reformas.',
            v_company_id,
            TRUE,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE garages 
        SET capacity = 12, address = 'Rua das Oficinas Mecânicas, 380 - Parque Industrial, Betim - MG',
            responsible_name = v_emp_3_name, responsible_phone = v_emp_3_phone
        WHERE id = v_garage_sul_id;
    END IF;

    -- Garagem 4: Garagem Expressa Leste
    SELECT id INTO v_garage_leste_id FROM garages WHERE company_id = v_company_id AND name ILIKE '%Garagem Expressa Leste%' LIMIT 1;
    IF v_garage_leste_id IS NULL THEN
        v_garage_leste_id := gen_random_uuid();
        INSERT INTO garages (id, name, address, responsible_employee_id, responsible_name, responsible_phone, capacity, notes, company_id, active, created_at, updated_at)
        VALUES (
            v_garage_leste_id,
            'Garagem Expressa Leste',
            'Av. Presidente Dutra, Km 182 - Pátio Logístico, Belford Roxo - RJ',
            v_emp_4_id,
            v_emp_4_name,
            v_emp_4_phone,
            8,
            'Estacionamento de apoio para rotas interestaduais e linhas executivas.',
            v_company_id,
            TRUE,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE garages 
        SET capacity = 8, address = 'Av. Presidente Dutra, Km 182 - Pátio Logístico, Belford Roxo - RJ',
            responsible_name = v_emp_4_name, responsible_phone = v_emp_4_phone
        WHERE id = v_garage_leste_id;
    END IF;

    -- 4. Garantir veículos representativos se a base tiver poucos veículos
    INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, project_name, assigned_driver, company_id, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(), 'BRA-2E19', 'MERCEDES-BENZ', 'OF-1721 Caio Apache VIP V', 2023, 'DIESEL', 44, 94250, 'ACTIVE', 'BUS_URBAN', 
        'Prefeitura Municipal - Linha 304', 'Marcos Vinicius Santos', v_company_id, NOW() - INTERVAL '30 days', NOW()
    ) ON CONFLICT (plate) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model;

    INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, project_name, assigned_driver, company_id, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(), 'VAL-7G88', 'VOLVO', 'B340R Rodoviário Paradiso G8', 2024, 'DIESEL', 48, 48100, 'ACTIVE', 'BUS_INTERCITY', 
        'Mineração Vale - Turno Especial', 'Antônio Carlos de Paula', v_company_id, NOW() - INTERVAL '60 days', NOW()
    ) ON CONFLICT (plate) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model;

    INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, project_name, assigned_driver, company_id, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(), 'MAN-3K44', 'SCANIA', 'K310 Ônibus Articulado 21m', 2022, 'DIESEL', 85, 185600, 'MAINTENANCE', 'BUS_URBAN', 
        'Petrobras Transporte Industrial', 'José Roberto Ferreira', v_company_id, NOW() - INTERVAL '90 days', NOW()
    ) ON CONFLICT (plate) DO UPDATE SET status = 'MAINTENANCE', project_name = EXCLUDED.project_name;

    INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, project_name, assigned_driver, company_id, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(), 'REP-9M21', 'MERCEDES-BENZ', 'Sprinter 516 CDI 19+1 Van', 2023, 'DIESEL', 20, 68900, 'MAINTENANCE', 'VAN', 
        'Hospital das Clínicas - Equipe Médica', 'Patrícia Albuquerque Ramos', v_company_id, NOW() - INTERVAL '40 days', NOW()
    ) ON CONFLICT (plate) DO UPDATE SET status = 'MAINTENANCE', project_name = EXCLUDED.project_name;

    INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, project_name, assigned_driver, company_id, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(), 'RES-4X55', 'VOLKSWAGEN', '17.230 Ônibus Fretamento', 2021, 'DIESEL', 46, 212400, 'ACTIVE', 'BUS_URBAN', 
        'Reserva Técnica Operacional', 'Edson Pereira Lima', v_company_id, NOW() - INTERVAL '120 days', NOW()
    ) ON CONFLICT (plate) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model;

    INSERT INTO vehicles (id, plate, brand, model, year, fuel_type, capacity, current_mileage, status, vehicle_type, project_name, assigned_driver, company_id, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(), 'OPR-8H12', 'MERCEDES-BENZ', 'Accelo 1016 Furgão Carga', 2022, 'DIESEL', 3, 115300, 'ACTIVE', 'TRUCK', 
        'Logística Distribuição Express', 'Claudio Martins Souza', v_company_id, NOW() - INTERVAL '50 days', NOW()
    ) ON CONFLICT (plate) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model;

    -- 5. Vincular Veículos às Garagens e Gerar Movimentações com Tempos de Permanência Reais
    -- 5.1. Veículo 1 (BRA-2E19) -> Pátio Central (Recolhimento Noturno, entrou há 5 horas)
    UPDATE vehicles 
    SET garage_id = v_garage_central_id, garage_name = 'Pátio Central - Matriz Paulínia',
        operation_entry_date = CURRENT_DATE, assigned_driver = 'Marcos Vinicius Santos',
        project_name = 'Prefeitura Municipal - Linha 304'
    WHERE plate = 'BRA-2E19';

    DELETE FROM garage_movements WHERE vehicle_plate = 'BRA-2E19' AND active_stay = true;
    INSERT INTO garage_movements (id, vehicle_id, vehicle_plate, from_garage_id, from_garage_name, to_garage_id, to_garage_name, movement_type, driver_name, client_name, entry_time, active_stay, reason, reason_detail, km_reading, company_id, created_at)
    SELECT gen_random_uuid(), id, 'BRA-2E19', NULL, NULL, v_garage_central_id, 'Pátio Central - Matriz Paulínia', 'CHECK_IN', 'Marcos Vinicius Santos', 'Prefeitura Municipal - Linha 304', NOW() - INTERVAL '5 hours', true, 'RECOLHIMENTO', 'Final de escala da linha municipal', current_mileage, v_company_id, NOW() - INTERVAL '5 hours'
    FROM vehicles WHERE plate = 'BRA-2E19';

    -- 5.2. Veículo 2 (VAL-7G88) -> Pátio Norte (Escala, entrou há 18 horas)
    UPDATE vehicles 
    SET garage_id = v_garage_norte_id, garage_name = 'Pátio Norte - Base Mina do Sol',
        operation_entry_date = CURRENT_DATE - 1, assigned_driver = 'Antônio Carlos de Paula',
        project_name = 'Mineração Vale - Turno Especial'
    WHERE plate = 'VAL-7G88';

    DELETE FROM garage_movements WHERE vehicle_plate = 'VAL-7G88' AND active_stay = true;
    INSERT INTO garage_movements (id, vehicle_id, vehicle_plate, from_garage_id, from_garage_name, to_garage_id, to_garage_name, movement_type, driver_name, client_name, entry_time, active_stay, reason, reason_detail, km_reading, company_id, created_at)
    SELECT gen_random_uuid(), id, 'VAL-7G88', NULL, NULL, v_garage_norte_id, 'Pátio Norte - Base Mina do Sol', 'CHECK_IN', 'Antônio Carlos de Paula', 'Mineração Vale - Turno Especial', NOW() - INTERVAL '18 hours', true, 'ESCALA', 'Aguardando embarque de funcionários às 06:00', current_mileage, v_company_id, NOW() - INTERVAL '18 hours'
    FROM vehicles WHERE plate = 'VAL-7G88';

    -- 5.3. Veículo 3 (MAN-3K44) -> Oficina Sul (EM MANUTENÇÃO, entrou há 3 dias e 6 horas)
    UPDATE vehicles 
    SET garage_id = v_garage_sul_id, garage_name = 'Base de Apoio & Oficina Sul',
        status = 'MAINTENANCE', operation_entry_date = CURRENT_DATE - 3, 
        assigned_driver = 'José Roberto Ferreira', project_name = 'Petrobras Transporte Industrial'
    WHERE plate = 'MAN-3K44';

    DELETE FROM garage_movements WHERE vehicle_plate = 'MAN-3K44' AND active_stay = true;
    INSERT INTO garage_movements (id, vehicle_id, vehicle_plate, from_garage_id, from_garage_name, to_garage_id, to_garage_name, movement_type, driver_name, client_name, entry_time, active_stay, reason, reason_detail, km_reading, company_id, created_at)
    SELECT gen_random_uuid(), id, 'MAN-3K44', NULL, NULL, v_garage_sul_id, 'Base de Apoio & Oficina Sul', 'CHECK_IN', 'José Roberto Ferreira', 'Petrobras Transporte Industrial', NOW() - INTERVAL '3 days 6 hours', true, 'MANUTENCAO', 'Troca de pastilhas, cuícas de freio e válvula pneumática', current_mileage, v_company_id, NOW() - INTERVAL '3 days 6 hours'
    FROM vehicles WHERE plate = 'MAN-3K44';

    -- 5.4. Veículo 4 (REP-9M21) -> Oficina Sul (EM MANUTENÇÃO, Van parada há 1 dia e 4 horas)
    UPDATE vehicles 
    SET garage_id = v_garage_sul_id, garage_name = 'Base de Apoio & Oficina Sul',
        status = 'MAINTENANCE', operation_entry_date = CURRENT_DATE - 1, 
        assigned_driver = 'Patrícia Albuquerque Ramos', project_name = 'Hospital das Clínicas - Equipe Médica'
    WHERE plate = 'REP-9M21';

    DELETE FROM garage_movements WHERE vehicle_plate = 'REP-9M21' AND active_stay = true;
    INSERT INTO garage_movements (id, vehicle_id, vehicle_plate, from_garage_id, from_garage_name, to_garage_id, to_garage_name, movement_type, driver_name, client_name, entry_time, active_stay, reason, reason_detail, km_reading, company_id, created_at)
    SELECT gen_random_uuid(), id, 'REP-9M21', NULL, NULL, v_garage_sul_id, 'Base de Apoio & Oficina Sul', 'CHECK_IN', 'Patrícia Albuquerque Ramos', 'Hospital das Clínicas - Equipe Médica', NOW() - INTERVAL '28 hours', true, 'MANUTENCAO', 'Revisão do compressor de ar-condicionado e alinhamento', current_mileage, v_company_id, NOW() - INTERVAL '28 hours'
    FROM vehicles WHERE plate = 'REP-9M21';

    -- 5.5. Veículo 5 (RES-4X55) -> Pátio Central (RESERVA, parado há 4 dias)
    UPDATE vehicles 
    SET garage_id = v_garage_central_id, garage_name = 'Pátio Central - Matriz Paulínia',
        status = 'ACTIVE', operation_entry_date = CURRENT_DATE - 4, 
        assigned_driver = 'Edson Pereira Lima', project_name = 'Reserva Técnica Operacional'
    WHERE plate = 'RES-4X55';

    DELETE FROM garage_movements WHERE vehicle_plate = 'RES-4X55' AND active_stay = true;
    INSERT INTO garage_movements (id, vehicle_id, vehicle_plate, from_garage_id, from_garage_name, to_garage_id, to_garage_name, movement_type, driver_name, client_name, entry_time, active_stay, reason, reason_detail, km_reading, company_id, created_at)
    SELECT gen_random_uuid(), id, 'RES-4X55', NULL, NULL, v_garage_central_id, 'Pátio Central - Matriz Paulínia', 'CHECK_IN', 'Edson Pereira Lima', 'Reserva Técnica Operacional', NOW() - INTERVAL '4 days 2 hours', true, 'RESERVA', 'Veículo reserva abastecido e higienizado para substituição imediata', current_mileage, v_company_id, NOW() - INTERVAL '4 days 2 hours'
    FROM vehicles WHERE plate = 'RES-4X55';

    -- 5.6. Veículo 6 (OPR-8H12) -> Sem garagem (Em rota / Operação)
    UPDATE vehicles 
    SET garage_id = NULL, garage_name = NULL,
        status = 'ACTIVE', assigned_driver = 'Claudio Martins Souza', 
        project_name = 'Logística Distribuição Express'
    WHERE plate = 'OPR-8H12';

    -- 6. Inserir Movimentações Históricas de Saídas e Remanejamentos Concluídos
    INSERT INTO garage_movements (id, vehicle_id, vehicle_plate, from_garage_id, from_garage_name, to_garage_id, to_garage_name, movement_type, driver_name, client_name, entry_time, exit_time, stay_duration_minutes, active_stay, reason, reason_detail, km_reading, performed_by_name, company_id, created_at)
    SELECT gen_random_uuid(), id, 'OPR-8H12', v_garage_central_id, 'Pátio Central - Matriz Paulínia', NULL, 'Saída para Operação', 'CHECK_OUT', 'Claudio Martins Souza', 'Logística Distribuição Express', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours', 2520, false, 'OPERACAO', 'Liberado para rota de entregas da tarde', current_mileage, 'Carlos Henrique de Souza', v_company_id, NOW() - INTERVAL '6 hours'
    FROM vehicles WHERE plate = 'OPR-8H12'
    LIMIT 1;

    INSERT INTO garage_movements (id, vehicle_id, vehicle_plate, from_garage_id, from_garage_name, to_garage_id, to_garage_name, movement_type, driver_name, client_name, entry_time, exit_time, stay_duration_minutes, active_stay, reason, reason_detail, km_reading, performed_by_name, company_id, created_at)
    SELECT gen_random_uuid(), id, 'BRA-2E19', v_garage_central_id, 'Pátio Central - Matriz Paulínia', v_garage_norte_id, 'Pátio Norte - Base Mina do Sol', 'TRANSFER', 'Marcos Vinicius Santos', 'Prefeitura Municipal - Linha 304', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 1440, false, 'REMANEJAMENTO', 'Remanejamento temporário para cobertura de escala', current_mileage - 280, 'Roberto Fernandes Lima', v_company_id, NOW() - INTERVAL '4 days'
    FROM vehicles WHERE plate = 'BRA-2E19'
    LIMIT 1;

    RAISE NOTICE 'Seed de garagens e movimentações concluído com sucesso para a empresa %', v_company_id;
END $$;
