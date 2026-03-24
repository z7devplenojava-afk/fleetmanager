-- Script para inserir uma manutenção de teste com anexos
-- Execute este script no banco de dados para testar a visualização de miniaturas

INSERT INTO vehicle_maintenances (
    id,
    vehicle_id,
    date,
    maintenance_type,
    description,
    cost,
    provider,
    mileage,
    status,
    priority,
    notes,
    photos,
    documents,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '44307e51-d05e-4a37-98c6-fc3a8aa8f92b', -- ID do veículo TCO8G53
    '2025-09-25',
    'PREVENTIVE',
    'Manutenção preventiva com anexos de teste - troca de óleo, filtros e verificação geral do sistema',
    550.00,
    'Oficina Central Ltda',
    52000,
    'SCHEDULED',
    'MEDIUM',
    'Manutenção de rotina com anexos para teste de visualização de miniaturas. Verificar também freios e suspensão.',
    '["/uploads/maintenance/test-photo-1.jpg", "/uploads/maintenance/test-photo-2.png"]', -- Fotos de teste
    '["/uploads/maintenance/test-document-1.pdf", "/uploads/maintenance/test-document-2.pdf"]', -- Documentos de teste
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Verificar se foi inserido
SELECT 
    id,
    vehicle_id,
    date,
    maintenance_type,
    description,
    cost,
    provider,
    mileage,
    status,
    priority,
    notes,
    photos,
    documents,
    created_at,
    updated_at
FROM vehicle_maintenances 
WHERE description LIKE '%anexos de teste%'
ORDER BY created_at DESC
LIMIT 1;
