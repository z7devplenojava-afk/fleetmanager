-- Migration: Add company and sector fields to document_page table
-- Version: V354
-- Description: Adds company_name, company_cnpj, and work_post_name columns to store extracted company and sector information

ALTER TABLE document_page 
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS company_cnpj VARCHAR(20),
    ADD COLUMN IF NOT EXISTS work_post_name VARCHAR(150);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_document_page_company_cnpj ON document_page(company_cnpj);
CREATE INDEX IF NOT EXISTS idx_document_page_work_post_name ON document_page(work_post_name);

-- Add comments
COMMENT ON COLUMN document_page.company_name IS 'Name of the company extracted from the document';
COMMENT ON COLUMN document_page.company_cnpj IS 'CNPJ of the company extracted from the document';
COMMENT ON COLUMN document_page.work_post_name IS 'Work post/sector name extracted from the document';








































