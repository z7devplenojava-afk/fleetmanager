-- =====================================================================
-- V4692: Garantir Frota Operacional para Viacao Sao Silvestre e Multi-Tenant
-- Insere e vincula veiculos-chave da operacao (QRE-1A23, RUR-7A78, SHZ-3A40, etc.)
-- para que o modulo Operacional, Parte Diaria e Medicao sempre tenham frota completa.
-- =====================================================================

DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- 1. Localizar Viacao Sao Silvestre ou empresa ativa padrao
    SELECT id INTO v_company_id
    FROM companies
    WHERE regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g') IN ('71055644000125', '71055644000630')
       OR UPPER(name) LIKE '%SAO SILVESTRE%'
       OR UPPER(name) LIKE '%SILVESTRE%'
       OR UPPER(COALESCE(sigla, '')) = 'VSS'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM companies WHERE status = 'ACTIVE' LIMIT 1;
    END IF;

    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM companies LIMIT 1;
    END IF;

    -- 2. Vincular todos os veiculos com company_id nulo para essa empresa
    IF v_company_id IS NOT NULL THEN
        UPDATE vehicles
        SET company_id = v_company_id
        WHERE company_id IS NULL;
    END IF;

    -- 3. Inserir ou atualizar veiculos operacionais prioritarios
    -- QRE-1A23 (Onibus Rodoviario Marcopolo Paradiso G8)
    INSERT INTO vehicles (
        id, plate, brand, model, year, fuel_type, capacity, current_mileage,
        status, vehicle_type, project_name, company_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'QRE-1A23', 'MARCOPOLO', 'PARADISO G8 1200 SCANIA', 2024,
        'DIESEL', 46, 48100, 'ACTIVE', 'BUS_INTERCITY', 'Operacao Fretamento Vale',
        v_company_id, NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET
        company_id = COALESCE(vehicles.company_id, v_company_id),
        status = 'ACTIVE';

    -- RUR-7A78 (Carro Apoio Fiat Strada)
    INSERT INTO vehicles (
        id, plate, brand, model, year, fuel_type, capacity, current_mileage,
        status, vehicle_type, project_name, company_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'RUR-7A78', 'FIAT', 'STRADA FREEDOM 1.3', 2023,
        'FLEX', 5, 38200, 'ACTIVE', 'CAR', 'Supervisao & Apoio Operacional',
        v_company_id, NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET
        company_id = COALESCE(vehicles.company_id, v_company_id),
        status = 'ACTIVE';

    -- SHZ-3A40 (Micro-onibus Volare Fly 9)
    INSERT INTO vehicles (
        id, plate, brand, model, year, fuel_type, capacity, current_mileage,
        status, vehicle_type, project_name, company_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'SHZ-3A40', 'VOLARE', 'FLY 9 EXECUTIVO DIESEL', 2023,
        'DIESEL', 32, 64900, 'ACTIVE', 'MICROBUS', 'Fretamento Continuo Anglo',
        v_company_id, NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET
        company_id = COALESCE(vehicles.company_id, v_company_id),
        status = 'ACTIVE';

    -- QMR-2E82 (Micro-onibus Agrale Senior)
    INSERT INTO vehicles (
        id, plate, brand, model, year, fuel_type, capacity, current_mileage,
        status, vehicle_type, project_name, company_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'QMR-2E82', 'AGRALE', 'MARCOPOLO SENIOR MIDI', 2022,
        'DIESEL', 28, 403834, 'ACTIVE', 'MICROBUS', 'Linha Mina FM2C Ibirite',
        v_company_id, NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET
        company_id = COALESCE(vehicles.company_id, v_company_id),
        status = 'ACTIVE';

    -- ABC-1234 (Honda Civic Fiscalizacao)
    INSERT INTO vehicles (
        id, plate, brand, model, year, fuel_type, capacity, current_mileage,
        status, vehicle_type, project_name, company_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'ABC-1234', 'HONDA', 'CIVIC TOURING 1.5 TURBO', 2021,
        'GASOLINE', 5, 154256, 'ACTIVE', 'CAR', 'Supervisao Noturna',
        v_company_id, NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET
        company_id = COALESCE(vehicles.company_id, v_company_id),
        status = 'ACTIVE';

    -- SEM-PLACA (Scania Mpolo Paradiso DD)
    INSERT INTO vehicles (
        id, plate, brand, model, year, fuel_type, capacity, current_mileage,
        status, vehicle_type, project_name, company_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), 'SEM-PLACA', 'SCANIA', 'MPOLO PARADISO DD 1800', 2024,
        'DIESEL', 60, 155124, 'ACTIVE', 'BUS_INTERCITY', 'Linha Especial de Turismo',
        v_company_id, NOW(), NOW()
    ) ON CONFLICT (plate) DO UPDATE SET
        company_id = COALESCE(vehicles.company_id, v_company_id),
        status = 'ACTIVE';

END $$;
