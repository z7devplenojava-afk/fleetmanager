-- Test data for work posts
-- This script inserts sample work posts for testing

-- First ensure we have a client
INSERT INTO clients (id, name, cnpj, email, phone, address, city, state, zip_code, status, created_at, updated_at) 
VALUES (gen_random_uuid(), 'Cliente ABC Ltda', '12.345.678/0001-90', 'contato@abc.com', '(11) 3333-3333', 
        'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', 'ACTIVE', NOW(), NOW())
ON CONFLICT (cnpj) DO NOTHING;

-- Get the client ID
WITH client_data AS (
    SELECT id as client_id FROM clients WHERE cnpj = '12.345.678/0001-90' LIMIT 1
)
-- Insert test work posts
INSERT INTO work_posts (id, post_code, name, description, type, status, address, city, state, zip_code, 
                       client_id, required_vigilantes, work_schedule, shift_start, shift_end, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'POST-001',
    'Posto Shopping Center',
    'Posto de segurança no shopping center principal',
    'POSTO_24H',
    'ATIVO',
    'Av. Paulista, 1000',
    'São Paulo',
    'SP',
    '01310-100',
    cd.client_id,
    3,
    'Escala 24h',
    '00:00:00',
    '23:59:59',
    NOW(),
    NOW()
FROM client_data cd

UNION ALL

SELECT 
    gen_random_uuid(),
    'POST-002',
    'Posto Banco Central',
    'Posto de segurança na agência bancária',
    'POSTO_12H_DIURNO',
    'ATIVO',
    'Rua Augusta, 500',
    'São Paulo',
    'SP',
    '01305-000',
    cd.client_id,
    2,
    'Escala 12h diurna',
    '06:00:00',
    '18:00:00',
    NOW(),
    NOW()
FROM client_data cd

UNION ALL

SELECT 
    gen_random_uuid(),
    'POST-003',
    'Posto Residencial',
    'Posto de segurança em condomínio residencial',
    'POSTO_12H_NOTURNO',
    'EM_IMPLANTACAO',
    'Rua das Palmeiras, 200',
    'São Paulo',
    'SP',
    '04567-890',
    cd.client_id,
    1,
    'Escala 12h noturna',
    '18:00:00',
    '06:00:00',
    NOW(),
    NOW()
FROM client_data cd

UNION ALL

SELECT 
    gen_random_uuid(),
    'POST-004',
    'Posto Industrial',
    'Posto de segurança na área industrial',
    'POSTO_8H_DIURNO',
    'SUSPENSO',
    'Av. Industrial, 1500',
    'Guarulhos',
    'SP',
    '07000-000',
    cd.client_id,
    4,
    'Escala 8h diurna',
    '08:00:00',
    '16:00:00',
    NOW(),
    NOW()
FROM client_data cd

UNION ALL

SELECT 
    gen_random_uuid(),
    'POST-005',
    'Posto Empresarial',
    'Posto de segurança em edifício empresarial',
    'POSTO_SDF',
    'INATIVO',
    'Rua dos Negócios, 800',
    'São Paulo',
    'SP',
    '01234-000',
    cd.client_id,
    1,
    'Segunda a sexta',
    '07:00:00',
    '19:00:00',
    NOW(),
    NOW()
FROM client_data cd;

-- Verify inserted data
SELECT 'Inserted work posts:' as message;
SELECT post_code, name, status, city FROM work_posts ORDER BY post_code;