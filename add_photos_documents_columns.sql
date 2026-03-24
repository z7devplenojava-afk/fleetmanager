-- Script para adicionar as colunas photos e documents à tabela vehicle_maintenances
-- Execute este script diretamente no seu banco de dados PostgreSQL

-- Verificar se a tabela existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_maintenances') 
        THEN 'Tabela vehicle_maintenances existe'
        ELSE 'Tabela vehicle_maintenances NÃO existe'
    END as tabela_status;

-- Verificar colunas existentes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances' 
ORDER BY ordinal_position;

-- Adicionar coluna photos se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicle_maintenances' 
        AND column_name = 'photos'
    ) THEN
        ALTER TABLE vehicle_maintenances ADD COLUMN photos TEXT;
        RAISE NOTICE '✅ Coluna photos adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna photos já existe';
    END IF;
END $$;

-- Adicionar coluna documents se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicle_maintenances' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE vehicle_maintenances ADD COLUMN documents TEXT;
        RAISE NOTICE '✅ Coluna documents adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna documents já existe';
    END IF;
END $$;

-- Adicionar comentários
COMMENT ON COLUMN vehicle_maintenances.photos IS 'Lista de URLs das fotos da manutenção (JSON array)';
COMMENT ON COLUMN vehicle_maintenances.documents IS 'Lista de URLs dos documentos da manutenção (JSON array)';

-- Verificar resultado final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN column_name IN ('photos', 'documents') THEN '✅ Adicionada'
        ELSE 'Existe'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'vehicle_maintenances' 
AND column_name IN ('photos', 'documents')
ORDER BY column_name;

-- Verificar se há registros na tabela
SELECT 
    COUNT(*) as total_registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Tabela tem dados'
        ELSE '⚠️ Tabela vazia'
    END as status_dados
FROM vehicle_maintenances;
