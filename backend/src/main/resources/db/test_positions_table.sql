-- Teste da estrutura da tabela positions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'positions' 
ORDER BY ordinal_position;

-- Verificar se existem dados na tabela
SELECT COUNT(*) as total_positions FROM positions;

-- Verificar se há constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'positions';

-- Verificar foreign keys
SELECT 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'positions';

-- Verificar dados existentes (se houver)
SELECT id, name, description, unit_id, created_at, updated_at 
FROM positions 
LIMIT 5;
