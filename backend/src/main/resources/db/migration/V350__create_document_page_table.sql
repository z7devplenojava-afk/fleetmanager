-- Migration: Create document_page table for intelligent payslip processing
-- Version: V350
-- Description: Creates table to track individual pages extracted from PDFs with OCR data

CREATE TABLE IF NOT EXISTS document_page (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('holerite', 'comprovante')),
    cpf VARCHAR(20),
    name VARCHAR(255),
    period VARCHAR(20),
    liquid_value DECIMAL(15,2),
    page_number INTEGER NOT NULL,
    raw_text TEXT,
    ocr_confidence FLOAT,
    hash VARCHAR(64),
    status VARCHAR(20) NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'review', 'error')),
    s3_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_document_page_job_id ON document_page(job_id);
CREATE INDEX IF NOT EXISTS idx_document_page_cpf ON document_page(cpf);
CREATE INDEX IF NOT EXISTS idx_document_page_hash ON document_page(hash);
CREATE INDEX IF NOT EXISTS idx_document_page_type ON document_page(type);
CREATE INDEX IF NOT EXISTS idx_document_page_status ON document_page(status);
CREATE INDEX IF NOT EXISTS idx_document_page_period ON document_page(period);
CREATE INDEX IF NOT EXISTS idx_document_page_liquid_value ON document_page(liquid_value);

-- Add comments
COMMENT ON TABLE document_page IS 'Stores individual pages extracted from PDFs with OCR data for intelligent processing';
COMMENT ON COLUMN document_page.job_id IS 'Reference to the processing job';
COMMENT ON COLUMN document_page.type IS 'Type of document: holerite or comprovante';
COMMENT ON COLUMN document_page.ocr_confidence IS 'OCR confidence score (0.0 to 1.0)';
COMMENT ON COLUMN document_page.hash IS 'MD5 hash of the page content for duplicate detection';
COMMENT ON COLUMN document_page.status IS 'Processing status: ok, review, error';
COMMENT ON COLUMN document_page.s3_url IS 'URL to the page image stored in S3/MinIO';

