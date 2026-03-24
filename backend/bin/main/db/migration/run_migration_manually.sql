-- Script para executar a migration V338 manualmente
-- Execute este script diretamente no banco de dados PostgreSQL

-- Verificar se a tabela já existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'unification_jobs'
) AS table_exists;

-- Se a tabela não existir, executar a migration:
-- Migration: Create unification_jobs table for async batch processing
-- Version: V338

CREATE TABLE IF NOT EXISTS unification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL,
    month INTEGER,
    year INTEGER,
    force_unification BOOLEAN DEFAULT FALSE,
    total_documents INTEGER NOT NULL DEFAULT 0,
    processed_documents INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    error_message VARCHAR(2000),
    processing_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_unification_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_unification_jobs_status ON unification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_at ON unification_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unification_jobs_created_by ON unification_jobs(created_by);

-- Adicionar registro na tabela flyway_schema_history para marcar como executada
-- IMPORTANTE: Ajuste o checksum se necessário (pode ser obtido executando a migration via Flyway)
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
SELECT 
    COALESCE(MAX(installed_rank), 0) + 1,
    '338',
    'create unification jobs table',
    'SQL',
    'V338__create_unification_jobs_table.sql',
    0, -- Checksum será calculado automaticamente pelo Flyway na próxima validação
    current_user,
    CURRENT_TIMESTAMP,
    0,
    true
FROM flyway_schema_history
WHERE NOT EXISTS (
    SELECT 1 FROM flyway_schema_history WHERE version = '338'
);

-- Verificar se foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'unification_jobs'
ORDER BY ordinal_position;

