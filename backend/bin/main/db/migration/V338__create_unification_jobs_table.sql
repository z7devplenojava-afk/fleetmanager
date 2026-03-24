-- Migration: Create unification_jobs table for async batch processing
-- Version: V338
-- Description: Creates table to track batch unification jobs with progress tracking

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

-- Add comment to table
COMMENT ON TABLE unification_jobs IS 'Tracks batch document unification jobs with progress information';
COMMENT ON COLUMN unification_jobs.status IS 'Job status: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED';
COMMENT ON COLUMN unification_jobs.total_documents IS 'Total number of documents to process';
COMMENT ON COLUMN unification_jobs.processed_documents IS 'Number of documents already processed';
COMMENT ON COLUMN unification_jobs.success_count IS 'Number of successfully unified documents';
COMMENT ON COLUMN unification_jobs.failure_count IS 'Number of failed unifications';

