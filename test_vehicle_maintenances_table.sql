-- Teste para verificar se a tabela vehicle_maintenances existe e tem as colunas corretas
-- Execute este script no banco de dados para verificar a estrutura

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicle_maintenances'
) as table_exists;

-- Verificar as colunas da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances'
ORDER BY ordinal_position;

-- Verificar se as colunas photos e documents existem
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances' 
AND column_name IN ('photos', 'documents');
