-- Migration: Create document_processing_jobs table for async processing pipeline
-- Version: V351
-- Description: Creates table to track document processing jobs in Redis Streams pipeline

CREATE TABLE IF NOT EXISTS document_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    total_pages INTEGER DEFAULT 0,
    processed_pages INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_document_processing_jobs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_status ON document_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_created_at ON document_processing_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_created_by ON document_processing_jobs(created_by);

-- Add comments
COMMENT ON TABLE document_processing_jobs IS 'Tracks document processing jobs in the Redis Streams pipeline';
COMMENT ON COLUMN document_processing_jobs.status IS 'Job status: QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED';
COMMENT ON COLUMN document_processing_jobs.progress_percentage IS 'Processing progress (0-100)';

