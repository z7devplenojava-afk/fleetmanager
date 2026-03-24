-- Script para corrigir nomes das colunas na tabela unified_documents
-- Execute este script no banco de dados CI se a migration V336 não foi executada

-- Verificar se as colunas antigas existem
DO $$
BEGIN
    -- Renomear unified_file_name para file_name (se existir)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'unified_documents' 
        AND column_name = 'unified_file_name'
    ) THEN
        ALTER TABLE unified_documents RENAME COLUMN unified_file_name TO file_name;
        RAISE NOTICE 'Coluna unified_file_name renomeada para file_name';
    ELSE
        RAISE NOTICE 'Coluna unified_file_name não existe (já foi renomeada ou não existe)';
    END IF;

    -- Renomear unified_file_path para file_path (se existir)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'unified_documents' 
        AND column_name = 'unified_file_path'
    ) THEN
        ALTER TABLE unified_documents RENAME COLUMN unified_file_path TO file_path;
        RAISE NOTICE 'Coluna unified_file_path renomeada para file_path';
    ELSE
        RAISE NOTICE 'Coluna unified_file_path não existe (já foi renomeada ou não existe)';
    END IF;
END $$;

-- Adicionar comentários
COMMENT ON COLUMN unified_documents.file_name IS 'Nome do arquivo unificado';
COMMENT ON COLUMN unified_documents.file_path IS 'Caminho completo do arquivo unificado';

