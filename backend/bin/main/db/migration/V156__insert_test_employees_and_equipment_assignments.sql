-- Migration: V275__insert_test_employees_and_equipment_assignments.sql
-- Inserir funcionários de teste e associar equipamentos

-- Inserir funcionários de teste
INSERT INTO employees (
    id, user_id, position_id, registration_number, hire_date, status, name, document, 
    address, phone, email, marital_status, nationality, birth_date, unit_id
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    (SELECT id FROM positions WHERE name = 'Vigilante' LIMIT 1),
    'EMP001',
    '2023-01-15',
    'ACTIVE',
    'João Silva',
    '123.456.789-00',
    'Rua das Flores, 123 - São Paulo/SP',
    '(11) 99999-9999',
    'joao.silva@example.com',
    'Solteiro',
    'Brasileira',
    '1985-05-15',
    (SELECT id FROM units WHERE name = 'Unidade Principal' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000011',
    (SELECT id FROM positions WHERE name = 'Supervisor' LIMIT 1),
    'EMP002',
    '2022-08-20',
    'ACTIVE',
    'Maria Santos',
    '987.654.321-00',
    'Av. Paulista, 1000 - São Paulo/SP',
    '(11) 88888-8888',
    'maria.santos@example.com',
    'Casada',
    'Brasileira',
    '1980-12-10',
    (SELECT id FROM units WHERE name = 'Unidade Principal' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000012',
    (SELECT id FROM positions WHERE name = 'Vigilante' LIMIT 1),
    'EMP003',
    '2023-03-10',
    'ACTIVE',
    'Pedro Costa',
    '456.789.123-00',
    'Rua Augusta, 500 - São Paulo/SP',
    '(11) 77777-7777',
    'pedro.costa@example.com',
    'Solteiro',
    'Brasileira',
    '1990-08-25',
    (SELECT id FROM units WHERE name = 'Unidade Secundária' LIMIT 1)
);

-- Atualizar alguns equipamentos para associar a funcionários
UPDATE equipments 
SET current_user_id = '00000000-0000-0000-0000-000000000001',
    status = 'EM_USO'
WHERE serial_number = 'EQ-001-2020';

UPDATE equipments 
SET current_user_id = '00000000-0000-0000-0000-000000000002',
    status = 'EM_USO'
WHERE serial_number = 'EQ-002-2021';

-- Inserir mais equipamentos de teste
INSERT INTO equipments (
    status, ballistic_plate, manufacturing_date, weapon_registration_validity,
    usage_type, serial_number, ca_number, protection_level, batch, model,
    size, validity_date, is_dangerous, notes, current_user_id
) VALUES
(
    'EM_USO', 'BP-003', '2022-06-15', '2026-06-15',
    'USO_DIARIO', 'EQ-004-2022', 'CA-12348', 'IIIA', 'LOTE-2022-06',
    'Colete Balístico Modelo A', 'G', '2027-06-15', true,
    'Colete balístico nível IIIA em uso',
    '00000000-0000-0000-0000-000000000001'
),
(
    'EM_ESTOQUE', 'BP-004', '2023-01-10', NULL,
    'USO_EVENTUAL', 'EQ-005-2023', 'CA-12349', 'II', 'LOTE-2023-01',
    'Capacete Balístico B', 'M', '2028-01-10', false,
    'Capacete de proteção nível II em estoque',
    NULL
),
(
    'EM_MANUTENCAO', 'BP-005', '2021-09-20', '2025-09-20',
    'RESERVADO', 'EQ-006-2021', 'CA-12350', 'III', 'LOTE-2021-09',
    'Escudo Balístico C', 'UNICO', '2026-09-20', true,
    'Escudo balístico em manutenção',
    NULL
),
(
    'EM_USO', NULL, '2020-12-05', '2024-12-05',
    'USO_DIARIO', 'EQ-007-2020', 'CA-12351', 'IIIA', 'LOTE-2020-12',
    'Arma de Fogo Modelo X', 'UNICO', '2025-12-05', true,
    'Arma de fogo em uso pelo supervisor',
    '00000000-0000-0000-0000-000000000002'
),
(
    'EM_USO', 'BP-006', '2023-03-15', NULL,
    'USO_DIARIO', 'EQ-008-2023', 'CA-12352', 'IIIA', 'LOTE-2023-03',
    'Colete Balístico Modelo Y', 'P', '2028-03-15', true,
    'Colete balístico em uso',
    '00000000-0000-0000-0000-000000000003'
); 