-- Migration: V276__insert_missing_test_data.sql
-- Inserir dados de teste que estão faltando para funcionários e equipamentos

-- Unidades já existem na migração V11, não precisamos inserir novamente

-- Inserir posições adicionais (usando unidades existentes)
INSERT INTO positions (id, name, description, unit_id)
VALUES
(
    '00000000-0000-0000-0000-000000000009',
    'Vigilante',
    'Cargo de vigilante',
    (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000010',
    'Supervisor',
    'Cargo de supervisor',
    (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
),
(
    '00000000-0000-0000-0000-000000000011',
    'Vigilante',
    'Cargo de vigilante',
    (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
);

-- Atualizar a migração V275 para usar os IDs corretos
UPDATE employees 
SET position_id = '00000000-0000-0000-0000-000000000009',
    unit_id = (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE employees 
SET position_id = '00000000-0000-0000-0000-000000000010',
    unit_id = (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE employees 
SET position_id = '00000000-0000-0000-0000-000000000011',
    unit_id = (SELECT id FROM units WHERE name = 'Matriz' LIMIT 1)
WHERE id = '00000000-0000-0000-0000-000000000003'; 