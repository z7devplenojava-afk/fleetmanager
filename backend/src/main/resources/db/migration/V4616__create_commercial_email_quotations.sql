-- =====================================================================
-- V4616: Módulo Comercial - Gestão de Cotações por E-mail & Anexos Seguros
-- Integração com comercialvss@viacaosaosilvestre.com.br
-- =====================================================================

CREATE TABLE IF NOT EXISTS commercial_email_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    email_message_id UUID,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    client_name VARCHAR(255),
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    received_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'IN_ANALYSIS', 'PROPOSAL_GENERATED', 'REJECTED', 'ARCHIVED'
    confidence_score INTEGER DEFAULT 0,
    detection_keywords TEXT,
    extracted_origin VARCHAR(255),
    extracted_destination VARCHAR(255),
    extracted_trip_date VARCHAR(100),
    extracted_return_date VARCHAR(100),
    extracted_passengers INTEGER,
    extracted_vehicle_type VARCHAR(100),
    notes TEXT,
    proposal_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_email_quot_company ON commercial_email_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_comm_email_quot_status ON commercial_email_quotations(status);
CREATE INDEX IF NOT EXISTS idx_comm_email_quot_received ON commercial_email_quotations(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_email_quot_sender ON commercial_email_quotations(sender_email);

CREATE TABLE IF NOT EXISTS commercial_quotation_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES commercial_email_quotations(id) ON DELETE CASCADE,
    company_id UUID,
    file_name VARCHAR(500) NOT NULL,
    content_type VARCHAR(200),
    file_size BIGINT,
    file_path TEXT,
    security_status VARCHAR(30) DEFAULT 'VERIFIED_SAFE', -- 'VERIFIED_SAFE', 'SUSPICIOUS', 'BLOCKED', 'PENDING_SCAN'
    security_details TEXT,
    file_hash VARCHAR(100),
    is_manual_upload BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_quot_att_quotation ON commercial_quotation_attachments(quotation_id);
CREATE INDEX IF NOT EXISTS idx_comm_quot_att_company ON commercial_quotation_attachments(company_id);

-- Inserir / Garantir a conta de e-mail comercial corporativa da São Silvestre
DO $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT id INTO v_company_id FROM companies WHERE UPPER(name) LIKE '%SILVESTRE%' LIMIT 1;
    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM companies LIMIT 1;
    END IF;

    IF v_company_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM email_accounts WHERE email_address = 'comercialvss@viacaosaosilvestre.com.br') THEN
            INSERT INTO email_accounts (
                id, company_id, email_address, display_name,
                imap_host, imap_port, imap_ssl,
                smtp_host, smtp_port, smtp_ssl,
                username, password_encrypted, auth_type, status,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_company_id, 'comercialvss@viacaosaosilvestre.com.br', 'Comercial Viação São Silvestre',
                'mail.viacaosaosilvestre.com.br', 993, TRUE,
                'mail.viacaosaosilvestre.com.br', 465, TRUE,
                'comercialvss@viacaosaosilvestre.com.br', 'Comerci@l2026', 'PASSWORD', 'ACTIVE',
                NOW(), NOW()
            );
        END IF;
    END IF;
END $$;
