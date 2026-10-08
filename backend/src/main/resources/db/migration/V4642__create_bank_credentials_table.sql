-- Migration: V4642__create_bank_credentials_table.sql
-- Description: Cria a tabela bank_credentials para credenciais de API bancária

CREATE TABLE IF NOT EXISTS bank_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    client_id VARCHAR(255),
    client_secret VARCHAR(500),
    certificate_path VARCHAR(500),
    environment VARCHAR(20) DEFAULT 'SANDBOX',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_credentials_company_id ON bank_credentials(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_credentials_bank_code ON bank_credentials(bank_code);
