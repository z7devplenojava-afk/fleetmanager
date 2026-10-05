-- ============================================================
-- V4600: Controle de Certificações Federais, Municipais e Estaduais (CFME)
-- Armazena documentos (PDF/Excel) de órgãos reguladores (ANTT, ATR, DEER,
-- CREA, certidões em geral, listas de passageiros, autorizações de viagem,
-- atas etc.) com controle de validade e isolamento por empresa.
-- ============================================================

CREATE TABLE IF NOT EXISTS cfme_documents (
    id UUID PRIMARY KEY,
    category VARCHAR(40) NOT NULL,
    title VARCHAR(180),
    issuer VARCHAR(150),
    document_number VARCHAR(80),
    issue_date DATE,
    expiry_date DATE,
    stored_path TEXT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(120),
    notes TEXT,
    uploaded_by UUID,
    uploaded_by_name VARCHAR(200),
    company_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cfme_documents_company ON cfme_documents (company_id);
CREATE INDEX IF NOT EXISTS idx_cfme_documents_category ON cfme_documents (category);
CREATE INDEX IF NOT EXISTS idx_cfme_documents_expiry ON cfme_documents (expiry_date);
