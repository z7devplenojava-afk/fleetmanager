-- Migration: Add file_size column to unified_documents table
-- Version: V340
-- Description: Adds file_size column to track the size of unified PDF files

-- Adicionar coluna file_size se não existir
ALTER TABLE unified_documents 
    ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Comentário para documentação
COMMENT ON COLUMN unified_documents.file_size IS 'Tamanho do arquivo unificado em bytes';

