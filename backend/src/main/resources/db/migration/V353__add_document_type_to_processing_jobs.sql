-- Migration: Add document_type column to document_processing_jobs table
-- Version: V353
-- Description: Adds document_type column to track if job is for HOLERITE or COMPROVANTE processing

ALTER TABLE document_processing_jobs 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(20);

-- Update existing records to default to HOLERITE
UPDATE document_processing_jobs 
SET document_type = 'HOLERITE' 
WHERE document_type IS NULL;

-- Add comment
COMMENT ON COLUMN document_processing_jobs.document_type IS 'Type of document being processed: HOLERITE or COMPROVANTE';

