-- Migration: Fix document_page constraints to use uppercase enum values
-- Version: V352
-- Description: Updates CHECK constraints to accept uppercase enum values matching Java enums

-- Drop existing constraints
ALTER TABLE document_page DROP CONSTRAINT IF EXISTS document_page_type_check;
ALTER TABLE document_page DROP CONSTRAINT IF EXISTS document_page_status_check;

-- Add new constraints with uppercase values
ALTER TABLE document_page 
    ADD CONSTRAINT document_page_type_check CHECK (type IN ('HOLERITE', 'COMPROVANTE'));

ALTER TABLE document_page 
    ADD CONSTRAINT document_page_status_check CHECK (status IN ('OK', 'REVIEW', 'ERROR'));

-- Update default value for status
ALTER TABLE document_page 
    ALTER COLUMN status SET DEFAULT 'OK';

-- Update existing data to uppercase (if any)
UPDATE document_page SET type = UPPER(type) WHERE type IS NOT NULL;
UPDATE document_page SET status = UPPER(status) WHERE status IS NOT NULL;

-- Update comments
COMMENT ON COLUMN document_page.type IS 'Type of document: HOLERITE or COMPROVANTE';
COMMENT ON COLUMN document_page.status IS 'Processing status: OK, REVIEW, ERROR';

