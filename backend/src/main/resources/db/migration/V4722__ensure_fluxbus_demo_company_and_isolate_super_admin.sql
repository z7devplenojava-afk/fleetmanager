-- Migration: V4722__ensure_fluxbus_demo_company_and_isolate_super_admin.sql
-- Descrição: Cria/garante a empresa de demonstração FluxBus Transportes, vincula o Super Admin e isola seus dados de demonstração das outras empresas.

DO $$
DECLARE
    v_fluxbus_id UUID := '00000000-0000-4000-a000-000000000001';
    v_vss_id UUID;
    v_demo_client_id UUID;
    v_demo_work_post_id UUID;
BEGIN
    -- 1. Obter ou Criar a empresa de demonstração FluxBus Transportes
    IF NOT EXISTS (SELECT 1 FROM companies WHERE id = v_fluxbus_id OR sigla = 'FLU' OR LOWER(name) LIKE '%fluxbus transportes%') THEN
        INSERT INTO companies (
            id, name, cnpj, sigla, status, type, created_at, updated_at
        ) VALUES (
            v_fluxbus_id,
            'FLUXBUS TRANSPORTES LTDA',
            '00.000.000/0001-00',
            'FLU',
            'ACTIVE',
            'MATRIZ',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE 
          SET name = 'FLUXBUS TRANSPORTES LTDA', 
              sigla = 'FLU', 
              status = 'ACTIVE';
    ELSE
        SELECT id INTO v_fluxbus_id 
        FROM companies 
        WHERE id = v_fluxbus_id OR sigla = 'FLU' OR LOWER(name) LIKE '%fluxbus transportes%' 
        LIMIT 1;
    END IF;

    -- 2. Localizar a empresa de produção/real (Viação São Silvestre) para vincular os 5.400+ veículos reais
    SELECT id INTO v_vss_id FROM companies WHERE sigla = 'VSS' OR LOWER(name) LIKE '%silvestre%' LIMIT 1;
    IF v_vss_id IS NOT NULL THEN
        -- Garantir que os veículos reais sem company_id fiquem com a São Silvestre e NÃO na FluxBus
        UPDATE vehicles 
        SET company_id = v_vss_id 
        WHERE company_id IS NULL AND id NOT IN (
            SELECT id FROM vehicles WHERE plate LIKE 'FLX%'
        );
    END IF;

    -- 3. Vincular o usuário Super Admin (jose.ramos) à empresa FluxBus
    UPDATE users
    SET company_id = v_fluxbus_id
    WHERE LOWER(username) = 'jose.ramos' 
       OR id IN (
           SELECT ur.user_id FROM user_roles ur
           JOIN roles r ON ur.role_id = r.id
           WHERE r.name = 'SUPER_ADMIN'
       );

    -- 4. Criar Cliente de Demonstração para a FluxBus
    SELECT id INTO v_demo_client_id FROM clients WHERE company_id = v_fluxbus_id LIMIT 1;
    IF v_demo_client_id IS NULL THEN
        v_demo_client_id := gen_random_uuid();
        INSERT INTO clients (
            id, name, cnpj, email, phone, status, company_id, created_at, updated_at
        ) VALUES (
            v_demo_client_id,
            'DEMO MINERAÇÃO & LOGÍSTICA FLUXBUS S/A',
            '00.111.222/0001-33',
            'contato@demofluxbus.com.br',
            '(31) 3333-4444',
            'ACTIVE',
            v_fluxbus_id,
            NOW(),
            NOW()
        );
    END IF;

    -- 5. Criar Obra / Posto de Trabalho de Demonstração
    SELECT id INTO v_demo_work_post_id FROM work_posts WHERE post_code = 'PST-DEMO-01' OR client_id = v_demo_client_id LIMIT 1;
    IF v_demo_work_post_id IS NULL THEN
        v_demo_work_post_id := gen_random_uuid();
        INSERT INTO work_posts (
            id, post_code, name, address, type, status, client_id, required_vigilantes, work_schedule, shift_start, shift_end, created_at, updated_at
        ) VALUES (
            v_demo_work_post_id,
            'PST-DEMO-01',
            'Obra Demonstração Central (Canteiro 01)',
            'Av. Contorno, 500 - Belo Horizonte, MG',
            'POSTO_24H',
            'ATIVO',
            v_demo_client_id,
            2,
            '12x36',
            '07:00:00',
            '19:00:00',
            NOW(),
            NOW()
        ) ON CONFLICT (post_code) DO NOTHING;
    END IF;

    -- 6. Garantir Frota de Demonstração exclusiva da FluxBus (5 veículos limpos)
    -- Veículo 1
    INSERT INTO vehicles (
        id, plate, fleet_number, brand, model, year, model_year, color, status, fuel_type, vehicle_type, capacity, current_mileage, company_id, client_id, project_name, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'FLX1010', '1010', 'Marcopolo', 'Ideale 800', 2024, 2024, 'Branco/Vermelho', 'ACTIVE', 'DIESEL', 'ONIBUS_RODOVIARIO', 46, 12500, v_fluxbus_id, v_demo_client_id, 'Obra Demonstração Central (Canteiro 01)', NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET company_id = v_fluxbus_id, status = 'ACTIVE';

    -- Veículo 2
    INSERT INTO vehicles (
        id, plate, fleet_number, brand, model, year, model_year, color, status, fuel_type, vehicle_type, capacity, current_mileage, company_id, client_id, project_name, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'FLX2020', '2020', 'Mercedes-Benz', 'Sprinter 517 CDI', 2024, 2024, 'Prata', 'ACTIVE', 'DIESEL', 'VAN', 19, 8400, v_fluxbus_id, v_demo_client_id, 'Obra Demonstração Central (Canteiro 01)', NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET company_id = v_fluxbus_id, status = 'ACTIVE';

    -- Veículo 3
    INSERT INTO vehicles (
        id, plate, fleet_number, brand, model, year, model_year, color, status, fuel_type, vehicle_type, capacity, current_mileage, company_id, client_id, project_name, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'FLX3030', '3030', 'Volare', 'V8L 4X4', 2023, 2024, 'Branco', 'ACTIVE', 'DIESEL', 'MICROONIBUS', 28, 24000, v_fluxbus_id, v_demo_client_id, 'Obra Demonstração Central (Canteiro 01)', NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET company_id = v_fluxbus_id, status = 'ACTIVE';

    -- Veículo 4
    INSERT INTO vehicles (
        id, plate, fleet_number, brand, model, year, model_year, color, status, fuel_type, vehicle_type, capacity, current_mileage, company_id, client_id, project_name, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'FLX4040', '4040', 'Scania', 'Marcopolo Paradiso G8', 2025, 2025, 'Azul Metálico', 'ACTIVE', 'DIESEL', 'ONIBUS_LEITO', 50, 4200, v_fluxbus_id, v_demo_client_id, 'Obra Demonstração Central (Canteiro 01)', NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET company_id = v_fluxbus_id, status = 'ACTIVE';

    -- Veículo 5
    INSERT INTO vehicles (
        id, plate, fleet_number, brand, model, year, model_year, color, status, fuel_type, vehicle_type, capacity, current_mileage, company_id, client_id, project_name, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'FLX5050', '5050', 'Volkswagen', '17.230 Neobus New Mega', 2022, 2023, 'Branco', 'MAINTENANCE', 'DIESEL', 'ONIBUS_URBANO', 42, 68000, v_fluxbus_id, v_demo_client_id, 'Obra Demonstração Central (Canteiro 01)', NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET company_id = v_fluxbus_id, status = 'MAINTENANCE';

END $$;
