-- Migration: Create deletion_jobs table for async batch deletion
-- Version: V339
-- Description: Creates table to track batch deletion jobs with progress tracking

CREATE TABLE IF NOT EXISTS deletion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL,
    total_files INTEGER NOT NULL DEFAULT 0,
    processed_files INTEGER NOT NULL DEFAULT 0,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    error_message VARCHAR(2000),
    processing_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    file_names TEXT,
    CONSTRAINT fk_deletion_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_deletion_jobs_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_status ON deletion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_created_at ON deletion_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_created_by ON deletion_jobs(created_by);

COMMENT ON TABLE deletion_jobs IS 'Tabela para rastrear jobs de exclusão em lote de documentos unificados';
COMMENT ON COLUMN deletion_jobs.file_names IS 'JSON array com lista de nomes de arquivos a serem excluídos';

