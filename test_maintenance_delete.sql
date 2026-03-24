-- Script para testar o delete de manutenções
-- Execute este script para verificar se o delete está funcionando

-- 1. Verificar manutenções existentes
SELECT 
    id, 
    date, 
    maintenance_type, 
    description, 
    status,
    priority
FROM vehicle_maintenances 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Contar total de manutenções antes do teste
SELECT COUNT(*) as total_antes FROM vehicle_maintenances;

-- 3. Testar delete via SQL (substitua o UUID por um ID real)
-- DELETE FROM vehicle_maintenances WHERE id = 'UUID_AQUI';

-- 4. Verificar se há foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='vehicle_maintenances';

-- 5. Verificar se a tabela tem triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'vehicle_maintenances';
