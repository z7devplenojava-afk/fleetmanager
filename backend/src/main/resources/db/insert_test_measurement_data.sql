-- Script para inserir dados de teste de medição
-- Este script cria alguns boletins de medição de exemplo para testar a funcionalidade

-- Inserir dados de teste para medição simplificada
INSERT INTO measurement_bulletins (
    id,
    company_name,
    period_start,
    period_end,
    contract_number,
    contract_start,
    contract_end,
    nf_number,
    elaborated_by,
    measured_by,
    validated_by,
    checked_by,
    status,
    subtotal,
    client_id,
    contract_id,
    unit_id,
    notes,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
    '2024-01-01',
    '2024-01-31',
    'CTC-CBM-001/2024',
    '2024-01-01',
    '2024-12-31',
    'NF-001',
    'Sistema',
    'Sistema',
    NULL,
    NULL,
    'DRAFT',
    5000.00,
    (SELECT id FROM clients LIMIT 1),
    (SELECT id FROM contracts LIMIT 1),
    (SELECT id FROM units LIMIT 1),
    'Medição simplificada de teste - Janeiro 2024',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
    '2024-02-01',
    '2024-02-29',
    'CTC-CBM-002/2024',
    '2024-01-01',
    '2024-12-31',
    'NF-002',
    'Sistema',
    'Sistema',
    'Admin',
    'Supervisor',
    'VALIDATED',
    5500.00,
    (SELECT id FROM clients LIMIT 1),
    (SELECT id FROM contracts LIMIT 1),
    (SELECT id FROM units LIMIT 1),
    'Medição simplificada de teste - Fevereiro 2024',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'PROMOVER VIGILÂNCIA PATRIMONIAL LTDA',
    '2024-03-01',
    '2024-03-31',
    'CTC-CBM-003/2024',
    '2024-01-01',
    '2024-12-31',
    'NF-003',
    'Sistema',
    'Sistema',
    NULL,
    NULL,
    'PENDING',
    4800.00,
    (SELECT id FROM clients LIMIT 1),
    (SELECT id FROM contracts LIMIT 1),
    (SELECT id FROM units LIMIT 1),
    'Medição simplificada de teste - Março 2024',
    NOW(),
    NOW()
);

-- Inserir itens de medição para os boletins
INSERT INTO measurement_items (
    id,
    item_number,
    code,
    description,
    unit,
    quantity,
    unit_price,
    total_value,
    cost_center_id,
    cost_center_name,
    bulletin_id,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    1,
    'SERV-001',
    'Serviços de vigilância patrimonial - 12 horas',
    'VB/MÊS',
    1,
    5000.00,
    5000.00,
    '5',
    'Vigilância',
    (SELECT id FROM measurement_bulletins WHERE contract_number = 'CTC-CBM-001/2024'),
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    1,
    'SERV-002',
    'Serviços de vigilância patrimonial - 12 horas',
    'VB/MÊS',
    1,
    5500.00,
    5500.00,
    '5',
    'Vigilância',
    (SELECT id FROM measurement_bulletins WHERE contract_number = 'CTC-CBM-002/2024'),
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    1,
    'SERV-003',
    'Serviços de vigilância patrimonial - 12 horas',
    'VB/MÊS',
    1,
    4800.00,
    4800.00,
    '5',
    'Vigilância',
    (SELECT id FROM measurement_bulletins WHERE contract_number = 'CTC-CBM-003/2024'),
    NOW(),
    NOW()
);

-- Verificar se os dados foram inseridos
SELECT 
    mb.id,
    mb.company_name,
    mb.period_start,
    mb.period_end,
    mb.contract_number,
    mb.status,
    mb.subtotal,
    mb.notes,
    COUNT(mi.id) as item_count
FROM measurement_bulletins mb
LEFT JOIN measurement_items mi ON mb.id = mi.bulletin_id
GROUP BY mb.id, mb.company_name, mb.period_start, mb.period_end, mb.contract_number, mb.status, mb.subtotal, mb.notes
ORDER BY mb.created_at DESC;
