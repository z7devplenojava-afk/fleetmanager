-- Script para inserir dados de teste na tabela vehicle_maintenances
-- Execute este script APÓS criar a tabela

-- 1. Verificar se há veículos disponíveis para referência
SELECT 
    id, 
    plate, 
    brand, 
    model 
FROM vehicles 
LIMIT 5;

-- 2. Inserir dados de teste de manutenção
-- (Substitua os UUIDs dos veículos pelos IDs reais da sua tabela vehicles)

INSERT INTO vehicle_maintenances (
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
    documents
) VALUES 
-- Manutenção preventiva
(
    (SELECT id FROM vehicles LIMIT 1), -- Substitua pelo ID real de um veículo
    '2025-01-15',
    'PREVENTIVE',
    'Troca de óleo e filtros - Manutenção preventiva programada',
    150.00,
    'Oficina Central',
    50000,
    'COMPLETED',
    'MEDIUM',
    'Manutenção realizada conforme cronograma',
    '["https://exemplo.com/foto1.jpg", "https://exemplo.com/foto2.jpg"]',
    '["https://exemplo.com/nota_fiscal.pdf"]'
),
-- Manutenção corretiva
(
    (SELECT id FROM vehicles LIMIT 1), -- Substitua pelo ID real de um veículo
    '2025-01-20',
    'CORRECTIVE',
    'Reparo no sistema de freios - Problema identificado durante inspeção',
    350.00,
    'Oficina Especializada',
    52000,
    'COMPLETED',
    'HIGH',
    'Problema resolvido com sucesso',
    '["https://exemplo.com/foto3.jpg"]',
    '["https://exemplo.com/orcamento.pdf", "https://exemplo.com/nota_fiscal.pdf"]'
),
-- Manutenção agendada
(
    (SELECT id FROM vehicles LIMIT 1), -- Substitua pelo ID real de um veículo
    '2025-02-10',
    'PREVENTIVE',
    'Revisão geral e troca de correias - Manutenção preventiva',
    280.00,
    'Oficina Central',
    55000,
    'SCHEDULED',
    'MEDIUM',
    'Agendamento confirmado com a oficina',
    '[]',
    '[]'
);

-- 3. Verificar se os dados foram inseridos
SELECT 
    vm.id,
    vm.date,
    vm.maintenance_type,
    vm.description,
    vm.cost,
    vm.status,
    vm.priority,
    v.plate as vehicle_plate
FROM vehicle_maintenances vm
LEFT JOIN vehicles v ON vm.vehicle_id = v.id
ORDER BY vm.date DESC;

-- 4. Contar total de registros
SELECT 
    COUNT(*) as total_manutencoes,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completadas,
    COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as agendadas,
    COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as em_andamento
FROM vehicle_maintenances;
