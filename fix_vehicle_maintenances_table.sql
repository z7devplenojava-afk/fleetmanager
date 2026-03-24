-- Script para verificar e corrigir a estrutura da tabela vehicle_maintenances
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Verificar se a tabela existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'vehicle_maintenances'
        ) THEN 'Tabela vehicle_maintenances EXISTE'
        ELSE 'Tabela vehicle_maintenances NÃO EXISTE'
    END as status;

-- 2. Verificar todas as colunas da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances'
ORDER BY ordinal_position;

-- 3. Verificar especificamente as colunas photos e documents
SELECT 
    column_name,
    CASE 
        WHEN column_name = 'photos' THEN 'ENCONTRADA'
        WHEN column_name = 'documents' THEN 'ENCONTRADA'
        ELSE 'OUTRA COLUNA'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances' 
AND column_name IN ('photos', 'documents');

-- 4. Se as colunas não existirem, adicioná-las
DO $$
BEGIN
    -- Adicionar coluna photos se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicle_maintenances' 
        AND column_name = 'photos'
    ) THEN
        ALTER TABLE vehicle_maintenances ADD COLUMN photos TEXT;
        RAISE NOTICE 'Coluna photos adicionada';
    ELSE
        RAISE NOTICE 'Coluna photos já existe';
    END IF;

    -- Adicionar coluna documents se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicle_maintenances' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE vehicle_maintenances ADD COLUMN documents TEXT;
        RAISE NOTICE 'Coluna documents adicionada';
    ELSE
        RAISE NOTICE 'Coluna documents já existe';
    END IF;
END $$;

-- 5. Verificar novamente após as alterações
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances' 
AND column_name IN ('photos', 'documents')
ORDER BY column_name;

-- 6. Testar se a tabela pode ser consultada
SELECT COUNT(*) as total_records FROM vehicle_maintenances;
