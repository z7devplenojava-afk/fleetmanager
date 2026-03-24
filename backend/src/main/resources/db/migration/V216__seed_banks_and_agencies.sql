-- Seed minimal data for banks and agencies when empty

DO $$
DECLARE
    banks_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO banks_count FROM banks;

    IF banks_count = 0 THEN
        INSERT INTO banks (id, code, name, short_name, status, website, city, state)
        VALUES
            (gen_random_uuid(), '001', 'Banco do Brasil S.A.', 'BB', 'ACTIVE', 'www.bb.com.br', 'Brasília', 'DF'),
            (gen_random_uuid(), '341', 'Banco Itaú Unibanco S.A.', 'Itaú', 'ACTIVE', 'www.itau.com.br', 'São Paulo', 'SP');
    END IF;
END $$;

DO $$
DECLARE
    agencies_count INTEGER;
    any_bank_id UUID;
BEGIN
    SELECT COUNT(*) INTO agencies_count FROM agencies;

    IF agencies_count = 0 THEN
        -- pick any existing bank id for FK
        SELECT id INTO any_bank_id FROM banks ORDER BY name LIMIT 1;

        INSERT INTO agencies (
            id, bank_id, code, name, short_name, description, status, phone, address,
            city, state, zip_code, manager, manager_email, manager_phone, notes,
            created_at, updated_at
        ) VALUES
            (gen_random_uuid(), any_bank_id, '0001', 'Agência Central', 'Central', 'Agência central de testes', 'ACTIVE',
             '1130000000', 'Av. Principal, 100', 'São Paulo', 'SP', '01000-000', 'Gerente A', 'gerente.a@bank.com', '11999990000', NULL,
             NOW(), NOW()),
            (gen_random_uuid(), any_bank_id, '0002', 'Agência Sul', 'Sul', 'Agência sul de testes', 'ACTIVE',
             '5130000000', 'Rua Secundária, 200', 'Porto Alegre', 'RS', '90000-000', 'Gerente B', 'gerente.b@bank.com', '51988880000', NULL,
             NOW(), NOW());
    END IF;
END $$;


