-- Migration: V276__insert_missing_test_data.sql
-- Inserir dados de teste que estão faltando para funcionários e equipamentos

-- Unidades já existem na migração V11, não precisamos inserir novamente

-- Inserir posições adicionais (usando ID da unidade Matriz da V11)
-- A unidade Matriz tem ID: 00000000-0000-0000-0000-000000000005
INSERT INTO positions (id, name, description, unit_id)
VALUES
(
    '00000000-0000-0000-0000-000000000009',
    'Vigilante',
    'Cargo de vigilante',
    '00000000-0000-0000-0000-000000000005'
),
(
    '00000000-0000-0000-0000-000000000010',
    'Supervisor',
    'Cargo de supervisor',
    '00000000-0000-0000-0000-000000000005'
),
(
    '00000000-0000-0000-0000-000000000011',
    'Vigilante',
    'Cargo de vigilante',
    '00000000-0000-0000-0000-000000000005'
)
ON CONFLICT (id) DO NOTHING;

-- Atualizar funcionários com IDs corretos (se existirem)
UPDATE employees 
SET position_id = '00000000-0000-0000-0000-000000000009',
    unit_id = '00000000-0000-0000-0000-000000000005'
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE employees 
SET position_id = '00000000-0000-0000-0000-000000000010',
    unit_id = '00000000-0000-0000-0000-000000000005'
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE employees 
SET position_id = '00000000-0000-0000-0000-000000000011',
    unit_id = '00000000-0000-0000-0000-000000000005'
WHERE id = '00000000-0000-0000-0000-000000000003'; 